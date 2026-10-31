import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../base/database/prisma/prisma.service';
import { ReservationActor } from './auth/reservation-actor';
import {
  DashboardQueryDto,
  DepartureQueryDto,
  ReservationQueryDto,
} from './dto/reservation.dto';

export const departureInclude = {
  product: { select: { id: true, name: true, supplierId: true } },
} satisfies Prisma.TourDepartureInclude;

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
export type ReservationTransaction = Prisma.TransactionClient;

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

export type DashboardRow = DepartureMetrics & {
  date: string;
  productId: string;
  productName: string;
  status: string;
};

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

@Injectable()
export class ReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withLockedDeparture<T>(
    departureId: string,
    work: (tx: ReservationTransaction, departure: DepartureRecord) => Promise<T>
  ): Promise<T> {
    // Every reservation/attendance mutation locks the same parent row first.
    // READ COMMITTED then sees the preceding transaction's committed occupancy.
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

  findOwnedProduct(productId: string, supplierId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, supplierId },
      select: { id: true },
    });
  }

  createDeparture(data: Prisma.TourDepartureUncheckedCreateInput) {
    return this.prisma.tourDeparture.create({
      data,
      include: departureInclude,
    });
  }

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

  createReservation(
    data: Prisma.ReservationUncheckedCreateInput,
    tx: ReservationTransaction
  ) {
    return tx.reservation.create({ data, include: reservationInclude });
  }

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

  async findUserReservation(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
      include: reservationInclude,
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    return reservation;
  }

  async findSupplierDeparture(id: string, supplierId: string) {
    const departure = await this.prisma.tourDeparture.findFirst({
      where: { id, product: { supplierId } },
      include: departureInclude,
    });
    if (!departure) throw new NotFoundException('Saída não encontrada.');
    return departure;
  }

  updateReservations(
    ids: string[],
    data: Prisma.ReservationUpdateManyMutationInput,
    tx: ReservationTransaction
  ) {
    return tx.reservation.updateMany({ where: { id: { in: ids } }, data });
  }

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

  activeReservations(departureId: string, tx: ReservationTransaction) {
    return tx.reservation.findMany({
      where: { departureId, status: { not: ReservationStatus.CANCELLED } },
      include: reservationInclude,
    });
  }

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
