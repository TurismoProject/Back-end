import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../base/database/prisma/prisma.service';
import { ReservationActor } from './auth/reservation-actor';
import {
  DashboardQueryDto,
  DepartureQueryDto,
  ReservationQueryDto,
} from './dto/reservation.dto';

/**
 * Projeção compartilhada da saída com apenas os dados necessários do produto.
 * Não inclui credenciais nem dados pessoais do fornecedor.
 */
export const departureInclude = {
  product: { select: { id: true, name: true, supplierId: true } },
} satisfies Prisma.TourDepartureInclude;

/**
 * Carrega participantes e saída sem trazer o registro completo da conta responsável.
 * A ordenação por ID estabiliza a lista de participantes entre consultas.
 */
export const reservationInclude = {
  participants: { orderBy: { id: 'asc' as const } },
  departure: { include: departureInclude },
} satisfies Prisma.ReservationInclude;

export type DepartureRecord = Prisma.TourDepartureGetPayload<{
  include: typeof departureInclude;
}>;
export type ReservationRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;
/**
 * Cliente da transação atual; deve ser propagado a todas as gravações da operação.
 */
export type ReservationTransaction = Prisma.TransactionClient;

/**
 * Contagens de uma saída, separando reservas de passageiros e de embarques.
 * Somente passageiros confirmados entram nos indicadores de comparecimento.
 */
export interface DepartureMetrics {
  departureId: string;
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  pendingParticipants: number;
  confirmedParticipants: number;
  boardedParticipants: number;
  noShowParticipants: number;
  unrecordedParticipants: number;
}

/**
 * Métricas de uma saída com a data calculada no respectivo fuso IANA.
 */
export type DashboardRow = DepartureMetrics & {
  date: string;
  productId: string;
  productName: string;
  status: string;
};

/**
 * Agregações reutilizadas na disponibilidade e no painel.
 *
 * COUNT DISTINCT evita multiplicar reservas pelo número de participantes no JOIN.
 * Cancelados e pendentes não entram na ocupação confirmada nem no comparecimento.
 */
const metricsSql = Prisma.sql`
  COUNT(DISTINCT r.id)::int AS "totalReservations",
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'PENDING')::int AS "pendingReservations",
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CONFIRMED')::int AS "confirmedReservations",
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CANCELLED')::int AS "cancelledReservations",
  COUNT(p.id) FILTER (WHERE r.status = 'PENDING')::int AS "pendingParticipants",
  COUNT(p.id) FILTER (WHERE r.status = 'CONFIRMED')::int AS "confirmedParticipants",
  COUNT(p.id) FILTER (WHERE r.status = 'CONFIRMED' AND p.attendance = 'BOARDED')::int AS "boardedParticipants",
  COUNT(p.id) FILTER (WHERE r.status = 'CONFIRMED' AND p.attendance = 'NO_SHOW')::int AS "noShowParticipants",
  COUNT(p.id) FILTER (WHERE r.status = 'CONFIRMED' AND p.attendance = 'NOT_RECORDED')::int AS "unrecordedParticipants"
`;

/**
 * Centraliza persistência, escopos de consulta e transações do módulo de reservas.
 *
 * @remarks
 * Os services validam regras e propriedade dos recursos. Métodos de gravação
 * recebem o cliente da transação já aberta para preservar a atomicidade.
 * Não abra transações independentes dentro de withLockedDeparture.
 */
@Injectable()
export class ReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa uma mutação sob bloqueio exclusivo da saída no PostgreSQL.
   *
   * @param departureId Unidade comum de bloqueio para reservas e comparecimentos.
   * @param work Operação que deve consultar/gravar usando exclusivamente o tx recebido.
   * @returns O resultado do callback após o commit; erros revertem todas as gravações.
   * @remarks
   * SELECT FOR UPDATE serializa operações da mesma saída. Em READ COMMITTED,
   * as consultas posteriores ao bloqueio enxergam a ocupação confirmada pelo
   * concorrente anterior. Toda nova mutação que afete vagas deve seguir este caminho.
   * O bloqueio não autoriza o acesso: o callback ainda precisa verificar o proprietário.
   * @throws {NotFoundException} Se a saída não existir.
   */
  async withLockedDeparture<T>(
    departureId: string,
    work: (tx: ReservationTransaction, departure: DepartureRecord) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "TourDeparture" WHERE id = ${departureId} FOR UPDATE
      `;
        if (!locked.length)
          throw new NotFoundException('Saída não encontrada.');
        const departure = await tx.tourDeparture.findUnique({
          where: { id: departureId },
          include: departureInclude,
        });
        return work(tx, departure);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10000,
        timeout: 15000,
      }
    );
  }

  /**
   * Busca um produto dentro do escopo do fornecedor, sem expor produtos de terceiros.
   */
  findOwnedProduct(productId: string, supplierId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, supplierId },
      select: { id: true },
    });
  }

  /**
   * Persiste uma saída cujas regras e propriedade já foram validadas pelo service.
   * A restrição única do banco impede duplicar produto e instante de saída.
   */
  createDeparture(data: Prisma.TourDepartureUncheckedCreateInput) {
    return this.prisma.tourDeparture.create({
      data,
      include: departureInclude,
    });
  }

  /**
   * Consulta página, total e ocupação usando a mesma fotografia do banco.
   *
   * @param supplierId Escopo privado; omissão representa a consulta pública agregada.
   * @remarks
   * REPEATABLE READ mantém itens, total e vagas coerentes durante alterações concorrentes.
   * A disponibilidade é zero para saídas iniciadas ou em estado final.
   */
  async listDepartures(query: DepartureQueryDto, supplierId?: string) {
    const where: Prisma.TourDepartureWhereInput = {
      productId: query.productId,
      status: query.status,
      startsAt: {
        ...(query.startsFrom ? { gte: new Date(query.startsFrom) } : {}),
        ...(query.startsBefore ? { lt: new Date(query.startsBefore) } : {}),
      },
      ...(supplierId ? { product: { supplierId } } : {}),
    };
    return this.prisma.$transaction(
      async (tx) => {
        const items = await tx.tourDeparture.findMany({
          where,
          include: departureInclude,
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        const total = await tx.tourDeparture.count({ where });
        const metrics = await this.departureMetrics(
          items.map((item) => item.id),
          tx
        );
        const countsByDeparture = new Map(
          metrics.map((row) => [row.departureId, row])
        );
        const now = Date.now();
        return {
          items: items.map((item) => {
            const counts = countsByDeparture.get(item.id)!;
            const acceptsReservations =
              item.status === 'SCHEDULED' && item.startsAt.getTime() > now;
            return {
              ...item,
              metrics: counts,
              acceptsReservations,
              availableSeats: acceptsReservations
                ? item.capacity - counts.confirmedParticipants
                : 0,
            };
          }),
          total,
          page: query.page,
          limit: query.limit,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
    );
  }

  /**
   * Calcula métricas sem carregar nomes nem registros individuais dos participantes.
   *
   * @param tx Nas mutações, deve ser o cliente que mantém a saída bloqueada.
   * @remarks Esta consulta não adquire bloqueios nem garante vagas por conta própria.
   */
  async departureMetrics(
    ids: string[],
    tx: ReservationTransaction = this.prisma
  ): Promise<DepartureMetrics[]> {
    if (!ids.length) return [];
    return tx.$queryRaw<DepartureMetrics[]>(Prisma.sql`
      SELECT d.id AS "departureId", ${metricsSql}
      FROM "TourDeparture" d
      LEFT JOIN "Reservation" r ON r."departureId" = d.id
      LEFT JOIN "ReservationParticipant" p ON p."reservationId" = r.id
      WHERE d.id IN (${Prisma.join(ids)}) GROUP BY d.id
    `);
  }

  /**
   * Localiza um pedido anterior pela chave única no escopo do usuário.
   * Usado para impedir duplicação em reenvios e concorrência entre saídas diferentes.
   */
  findByRequestKey(
    userId: string,
    requestKey: string,
    tx: ReservationTransaction = this.prisma
  ) {
    return tx.reservation.findUnique({
      where: { userId_requestKey: { userId, requestKey } },
      include: reservationInclude,
    });
  }

  /**
   * Persiste a reserva e seus participantes aninhados na transação do chamador.
   * O service deve registrar o evento de criação antes do commit.
   */
  createReservation(
    data: Prisma.ReservationUncheckedCreateInput,
    tx: ReservationTransaction
  ) {
    return tx.reservation.create({ data, include: reservationInclude });
  }

  /**
   * Busca apenas IDs da saída informada; o service deve comparar a quantidade retornada.
   * A diferença indica IDs inexistentes ou de outra saída e invalida a seleção inteira.
   */
  findReservations(
    departureId: string,
    ids: string[],
    tx: ReservationTransaction
  ) {
    return tx.reservation.findMany({
      where: { departureId, id: { in: ids } },
      include: reservationInclude,
    });
  }

  /**
   * Lista reservas e total de forma consistente, preservando o escopo obrigatório de acesso.
   *
   * @param scope Restrição definida pelo service: usuário ou saída do próprio fornecedor.
   * @remarks Nunca construa scope a partir de um filtro arbitrário enviado pelo cliente.
   */
  async listReservations(
    query: ReservationQueryDto,
    scope: Prisma.ReservationWhereInput
  ) {
    const where = { ...scope, status: query.status };
    const [items, total] = await this.prisma.$transaction(
      [
        this.prisma.reservation.findMany({
          where,
          include: reservationInclude,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.prisma.reservation.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
    );
    return { items, total, page: query.page, limit: query.limit };
  }

  /**
   * Busca uma reserva no escopo do usuário sem distinguir inexistência de falta de acesso.
   * @throws {NotFoundException} Se não houver uma reserva própria com esse ID.
   */
  async findUserReservation(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
      include: reservationInclude,
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    return reservation;
  }

  /**
   * Busca uma saída no escopo do fornecedor dono do produto.
   * @throws {NotFoundException} Se a saída não existir ou pertencer a outro fornecedor.
   */
  async findSupplierDeparture(id: string, supplierId: string) {
    const departure = await this.prisma.tourDeparture.findFirst({
      where: { id, product: { supplierId } },
      include: departureInclude,
    });
    if (!departure) throw new NotFoundException('Saída não encontrada.');
    return departure;
  }

  /**
   * Altera IDs previamente autorizados e validados pelo service na transação bloqueada.
   * Este método não verifica propriedade nem regras de transição isoladamente.
   */
  updateReservations(
    ids: string[],
    data: Prisma.ReservationUpdateManyMutationInput,
    tx: ReservationTransaction
  ) {
    return tx.reservation.updateMany({ where: { id: { in: ids } }, data });
  }

  /**
   * Acrescenta um evento por reserva na mesma transação que alterou o estado.
   *
   * @param actor Identidade verificada de quem realizou a operação.
   * @param details Dados de auditoria da ação, sem credenciais ou tokens.
   * @remarks Em comparecimentos, envie somente IDs dos participantes da própria reserva.
   */
  recordEvents(
    ids: string[],
    actor: ReservationActor,
    action: string,
    details: Prisma.InputJsonObject,
    tx: ReservationTransaction
  ) {
    if (!ids.length) return;
    return tx.reservationEvent.createMany({
      data: ids.map((reservationId) => ({
        reservationId,
        actorId: actor.id,
        actorRole: actor.role,
        action,
        details,
      })),
    });
  }

  /**
   * Busca participantes da saída com o status da reserva para validar o comparecimento.
   * O service deve conferir que todos os IDs solicitados foram encontrados.
   */
  findParticipants(
    departureId: string,
    ids: string[],
    tx: ReservationTransaction
  ) {
    return tx.reservationParticipant.findMany({
      where: { id: { in: ids }, reservation: { departureId } },
      include: { reservation: { select: { id: true, status: true } } },
    });
  }

  /**
   * Atualiza comparecimento dos IDs validados usando a transação que bloqueou a saída.
   */
  updateParticipants(
    ids: string[],
    data: Prisma.ReservationParticipantUpdateManyMutationInput,
    tx: ReservationTransaction
  ) {
    return tx.reservationParticipant.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  /**
   * Persiste o estado final da saída na mesma transação das reservas e dos eventos.
   */
  updateDeparture(
    id: string,
    data: Prisma.TourDepartureUpdateInput,
    tx: ReservationTransaction
  ) {
    return tx.tourDeparture.update({
      where: { id },
      data,
      include: departureInclude,
    });
  }

  /**
   * Carrega reservas não canceladas para validar conclusão ou cancelamento da saída.
   */
  activeReservations(departureId: string, tx: ReservationTransaction) {
    return tx.reservation.findMany({
      where: { departureId, status: { not: ReservationStatus.CANCELLED } },
      include: reservationInclude,
    });
  }

  /**
   * Pagina eventos após conferir reserva, saída e fornecedor na mesma relação de acesso.
   * @throws {NotFoundException} Se a reserva não pertencer à saída do fornecedor.
   */
  async history(
    departureId: string,
    reservationId: string,
    supplierId: string,
    query: ReservationQueryDto
  ) {
    const exists = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        departureId,
        departure: { product: { supplierId } },
      },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Reserva não encontrada.');
    const where = { reservationId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reservationEvent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.reservationEvent.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  /**
   * Agrega uma linha por saída dentro do período local inclusivo e do fornecedor.
   *
   * @remarks
   * A conversão AT TIME ZONE usa o fuso salvo em cada saída antes de extrair o dia.
   * Os valores interpolados são parâmetros do Prisma, nunca SQL fornecido pelo cliente.
   * O limite de período é responsabilidade do SupplierDashboardService.
   */
  dashboard(supplierId: string, query: DashboardQueryDto) {
    return this.prisma.$queryRaw<DashboardRow[]>(Prisma.sql`
      SELECT d.id AS "departureId", d.status::text AS status,
        to_char(d."startsAt" AT TIME ZONE d."timeZone", 'YYYY-MM-DD') AS date,
        product.id AS "productId", product.name AS "productName", ${metricsSql}
      FROM "TourDeparture" d
      JOIN "Product" product ON product.id = d."productId"
      LEFT JOIN "Reservation" r ON r."departureId" = d.id
      LEFT JOIN "ReservationParticipant" p ON p."reservationId" = r.id
      WHERE product."supplierId" = ${supplierId}
        AND (d."startsAt" AT TIME ZONE d."timeZone")::date BETWEEN ${query.from}::date AND ${query.to}::date
        ${query.productId ? Prisma.sql`AND product.id = ${query.productId}` : Prisma.empty}
      GROUP BY d.id, product.id, product.name ORDER BY date, product.id, d.id
    `);
  }
}
