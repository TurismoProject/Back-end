import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma, ReservationStatus } from '@prisma/client';
import { ReservationActor } from './auth/reservation-actor';
import {
  CreateReservationDto,
  RecordAttendanceDto,
  ReservationAction,
  ReservationQueryDto,
  ResolveReservationsDto,
} from './dto/reservation.dto';
import {
  ReservationRecord,
  ReservationRepository,
} from './reservation.repository';
import {
  requireBeforeDeparture,
  requireCapacity,
  requireConfirmable,
  requireReason,
  requireScheduled,
} from './reservation.policy';

/**
 * Coordena a criação e a resolução de reservas e o comparecimento dos participantes.
 *
 * @remarks
 * O responsável vem da sessão; os passageiros vêm da lista de participantes.
 * Reservas pendentes não bloqueiam vagas. Toda mutação usa o bloqueio da saída
 * no repository para serializar alterações de capacidade e de comparecimento.
 */
@Injectable()
export class ReservationService {
  constructor(private readonly repository: ReservationRepository) {}

  /**
   * Reconhece um reenvio pelo conteúdo da reserva, ignorando a ordem dos nomes.
   *
   * Nomes repetidos são preservados: pessoas diferentes podem ter o mesmo nome.
   * @throws {ConflictException} Se a chave já representar outra saída ou lista.
   */
  private validateRetry(
    existing: ReservationRecord,
    dto: CreateReservationDto
  ) {
    const names = (values: { name: string }[]) =>
      values.map((p) => p.name).sort();
    if (
      existing.departureId !== dto.departureId ||
      JSON.stringify(names(existing.participants)) !==
        JSON.stringify(names(dto.participants))
    ) {
      throw new ConflictException(
        'requestKey já utilizado para outra solicitação.'
      );
    }
    return existing;
  }

  /**
   * Cria uma reserva pendente com participantes e preços copiados da saída.
   *
   * @param actor Usuário autenticado, usado como responsável pela reserva.
   * @param dto Saída, chave de repetição do pedido e passageiros que pretendem embarcar.
   * @returns A reserva criada ou a mesma reserva em um reenvio compatível.
   * @remarks
   * A quantidade de pessoas deriva da lista; o responsável não entra automaticamente.
   * O total é calculado com Decimal. A chave é única por usuário, e o tratamento de
   * P2002 também cobre pedidos simultâneos que bloqueiam saídas diferentes.
   * @throws {ConflictException} Se não houver vagas, a saída estiver fechada/iniciada
   * ou a chave já tiver sido usada com outro conteúdo.
   */
  async create(actor: ReservationActor, dto: CreateReservationDto) {
    try {
      return await this.repository.withLockedDeparture(
        dto.departureId,
        async (tx, departure) => {
          const existing = await this.repository.findByRequestKey(
            actor.id,
            dto.requestKey,
            tx
          );
          if (existing) return this.validateRetry(existing, dto);
          requireScheduled(departure.status);
          requireBeforeDeparture(departure.startsAt);
          const [metrics] = await this.repository.departureMetrics(
            [departure.id],
            tx
          );
          requireCapacity(
            departure.capacity,
            metrics.confirmedParticipants,
            dto.participants.length
          );
          const reservation = await this.repository.createReservation(
            {
              departureId: departure.id,
              userId: actor.id,
              responsibleName: actor.name,
              requestKey: dto.requestKey,
              pricePerPerson: departure.pricePerPerson,
              totalPrice: departure.pricePerPerson.mul(dto.participants.length),
              participants: {
                create: dto.participants.map(({ name }) => ({ name })),
              },
            },
            tx
          );
          await this.repository.recordEvents(
            [reservation.id],
            actor,
            'CREATED',
            {
              participantCount: dto.participants.length,
            },
            tx
          );
          return reservation;
        }
      );
    } catch (error) {
      // Concurrent requests may reuse a key across different departure locks.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.repository.findByRequestKey(
          actor.id,
          dto.requestKey
        );
        if (existing) return this.validateRetry(existing, dto);
      }
      throw error;
    }
  }

  /**
   * Lista somente as reservas do usuário autenticado, com paginação e filtro de status.
   */
  listForUser(actor: ReservationActor, query: ReservationQueryDto) {
    return this.repository.listReservations(query, { userId: actor.id });
  }

  /**
   * Obtém uma reserva própria sem revelar a existência de reservas de outros usuários.
   * @throws {NotFoundException} Se a reserva não existir ou pertencer a outra conta.
   */
  getForUser(actor: ReservationActor, id: string) {
    return this.repository.findUserReservation(id, actor.id);
  }

  /**
   * Lista responsáveis e participantes de uma saída pertencente ao fornecedor.
   * @throws {NotFoundException} Se a saída não pertencer ao fornecedor autenticado.
   */
  async listForSupplier(
    actor: ReservationActor,
    departureId: string,
    query: ReservationQueryDto
  ) {
    await this.repository.findSupplierDeparture(departureId, actor.id);
    return this.repository.listReservations(query, {
      departureId,
      departure: { product: { supplierId: actor.id } },
    });
  }

  /**
   * Consulta eventos paginados após verificar a relação entre reserva, saída e fornecedor.
   */
  history(
    departureId: string,
    reservationId: string,
    supplierId: string,
    query: ReservationQueryDto
  ) {
    return this.repository.history(
      departureId,
      reservationId,
      supplierId,
      query
    );
  }

  /**
   * Cancela uma reserva própria usando as mesmas regras e transação da operação em massa.
   *
   * O usuário só pode cancelar antes do início, sem participantes embarcados.
   * Um reenvio de cancelamento já aplicado não duplica o histórico.
   */
  async cancelForUser(actor: ReservationActor, id: string, reason: string) {
    const reservation = await this.repository.findUserReservation(id, actor.id);
    return this.resolve(actor, reservation.departureId, {
      action: ReservationAction.CANCEL,
      reservationIds: [id],
      reason,
    });
  }

  /**
   * Confirma ou cancela uma seleção de reservas da mesma saída em uma transação.
   *
   * @param actor Fornecedor responsável pela saída ou usuário cancelando a própria reserva.
   * @param departureId Saída usada como unidade de bloqueio e de autorização.
   * @param dto IDs únicos, ação e motivo obrigatório para novos cancelamentos.
   * @returns Totais solicitados/alterados e situação final da seleção.
   * @remarks
   * IDs de outra saída/conta invalidam a seleção inteira. Confirmação é exclusiva
   * do fornecedor e recalcula vagas apenas para as reservas que mudarão de status.
   * Repetir o estado desejado é uma operação sem alteração nem novos eventos.
   * @throws {NotFoundException} Se algum recurso não pertencer à saída ou conta.
   * @throws {ConflictException} Se uma transição, capacidade ou embarque impedir a ação.
   */
  resolve(
    actor: ReservationActor,
    departureId: string,
    dto: ResolveReservationsDto
  ) {
    return this.repository.withLockedDeparture(
      departureId,
      async (tx, departure) => {
        const isSupplier = actor.role === 'Supplier';
        if (isSupplier && departure.product.supplierId !== actor.id)
          throw new NotFoundException('Saída não encontrada.');
        const reservations = await this.repository.findReservations(
          departureId,
          dto.reservationIds,
          tx
        );
        if (
          reservations.length !== dto.reservationIds.length ||
          (!isSupplier && reservations.some((r) => r.userId !== actor.id))
        ) {
          throw new NotFoundException(
            'Uma ou mais reservas não pertencem a esta saída ou conta.'
          );
        }
        const target =
          dto.action === ReservationAction.CONFIRM
            ? ReservationStatus.CONFIRMED
            : ReservationStatus.CANCELLED;
        const changed = reservations.filter((r) => r.status !== target);
        if (!changed.length)
          return { requested: reservations.length, changed: 0, status: target };
        requireScheduled(departure.status);
        if (!isSupplier) requireBeforeDeparture(departure.startsAt);
        const ids = changed.map((r) => r.id);
        const now = new Date();
        if (dto.action === ReservationAction.CONFIRM) {
          if (!isSupplier)
            throw new ConflictException(
              'Somente o fornecedor pode confirmar reservas.'
            );
          requireBeforeDeparture(departure.startsAt);
          requireConfirmable(changed.map((r) => r.status));
          const [metrics] = await this.repository.departureMetrics(
            [departureId],
            tx
          );
          requireCapacity(
            departure.capacity,
            metrics.confirmedParticipants,
            changed.reduce((sum, r) => sum + r.participants.length, 0)
          );
          await this.repository.updateReservations(
            ids,
            { status: target, confirmedAt: now },
            tx
          );
        } else {
          const reason = requireReason(dto.reason);
          if (
            changed.some((r) =>
              r.participants.some(
                (p) => p.attendance === AttendanceStatus.BOARDED
              )
            )
          ) {
            throw new ConflictException(
              'Não é possível cancelar uma reserva com participantes embarcados.'
            );
          }
          await this.repository.updateReservations(
            ids,
            { status: target, cancelledAt: now, cancellationReason: reason },
            tx
          );
        }
        await this.repository.recordEvents(
          ids,
          actor,
          target,
          { reason: dto.reason?.trim() ?? null },
          tx
        );
        return {
          requested: reservations.length,
          changed: changed.length,
          status: target,
        };
      }
    );
  }

  /**
   * Registra ou corrige o comparecimento de participantes da mesma saída atomicamente.
   *
   * @param actor Fornecedor dono do passeio, verificado contra a saída bloqueada.
   * @param departureId Saída dos participantes selecionados.
   * @param dto IDs únicos e situação de comparecimento a aplicar.
   * @returns Quantidades solicitada/alterada e comparecimento desejado.
   * @remarks
   * Exige reservas confirmadas e saída agendada. Embarque abre duas horas antes;
   * ausência só é aceita a partir do início. NOT_RECORDED limpa autor/data atuais,
   * mas mantém os eventos anteriores. Eventos são separados por reserva para que
   * cada histórico contenha apenas os participantes daquela reserva.
   */
  recordAttendance(
    actor: ReservationActor,
    departureId: string,
    dto: RecordAttendanceDto
  ) {
    return this.repository.withLockedDeparture(
      departureId,
      async (tx, departure) => {
        if (departure.product.supplierId !== actor.id)
          throw new NotFoundException('Saída não encontrada.');
        const participants = await this.repository.findParticipants(
          departureId,
          dto.participantIds,
          tx
        );
        if (participants.length !== dto.participantIds.length) {
          throw new NotFoundException(
            'Um ou mais participantes não pertencem a esta saída.'
          );
        }
        if (
          participants.some(
            (p) => p.reservation.status !== ReservationStatus.CONFIRMED
          )
        ) {
          throw new ConflictException(
            'O comparecimento exige uma reserva confirmada.'
          );
        }
        const changed = participants.filter(
          (p) => p.attendance !== dto.attendance
        );
        if (!changed.length)
          return {
            requested: participants.length,
            changed: 0,
            attendance: dto.attendance,
          };
        requireScheduled(departure.status);
        const millisecondsUntilDeparture =
          departure.startsAt.getTime() - Date.now();
        if (
          dto.attendance === AttendanceStatus.BOARDED &&
          millisecondsUntilDeparture > 2 * 60 * 60 * 1000
        ) {
          throw new ConflictException(
            'O embarque abre duas horas antes da saída.'
          );
        }
        if (
          dto.attendance === AttendanceStatus.NO_SHOW &&
          millisecondsUntilDeparture > 0
        ) {
          throw new ConflictException(
            'A ausência só pode ser registrada após o início da saída.'
          );
        }
        await this.repository.updateParticipants(
          changed.map((p) => p.id),
          {
            attendance: dto.attendance,
            recordedAt:
              dto.attendance === AttendanceStatus.NOT_RECORDED
                ? null
                : new Date(),
            recordedBy:
              dto.attendance === AttendanceStatus.NOT_RECORDED
                ? null
                : actor.id,
          },
          tx
        );
        const reservationIds = [
          ...new Set(changed.map((p) => p.reservationId)),
        ];
        for (const reservationId of reservationIds) {
          await this.repository.recordEvents(
            [reservationId],
            actor,
            'ATTENDANCE_RECORDED',
            {
              attendance: dto.attendance,
              participantIds: changed
                .filter((p) => p.reservationId === reservationId)
                .map((p) => p.id),
            },
            tx
          );
        }
        return {
          requested: participants.length,
          changed: changed.length,
          attendance: dto.attendance,
        };
      }
    );
  }
}
