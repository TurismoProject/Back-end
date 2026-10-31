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

@Injectable()
export class ReservationService {
  constructor(private readonly repository: ReservationRepository) {}

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

  listForUser(actor: ReservationActor, query: ReservationQueryDto) {
    return this.repository.listReservations(query, { userId: actor.id });
  }

  getForUser(actor: ReservationActor, id: string) {
    return this.repository.findUserReservation(id, actor.id);
  }

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

  async cancelForUser(actor: ReservationActor, id: string, reason: string) {
    const reservation = await this.repository.findUserReservation(id, actor.id);
    return this.resolve(actor, reservation.departureId, {
      action: ReservationAction.CANCEL,
      reservationIds: [id],
      reason,
    });
  }

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
