import { BadRequestException, Injectable } from '@nestjs/common';
import { DashboardQueryDto } from './dto/reservation.dto';
import { DashboardRow, ReservationRepository } from './reservation.repository';

function emptyTotals() {
  return {
    departures: 0,
    completedDepartures: 0,
    cancelledDepartures: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    cancelledReservations: 0,
    pendingParticipants: 0,
    confirmedParticipants: 0,
    boardedParticipants: 0,
    noShowParticipants: 0,
    unrecordedParticipants: 0,
    completedParticipants: 0,
  };
}

type Totals = ReturnType<typeof emptyTotals>;

function addRow(totals: Totals, row: DashboardRow) {
  totals.departures++;
  if (row.status === 'COMPLETED') {
    totals.completedDepartures++;
    totals.completedParticipants += row.boardedParticipants;
  }
  if (row.status === 'CANCELLED') totals.cancelledDepartures++;
  const keys = [
    'totalReservations',
    'pendingReservations',
    'confirmedReservations',
    'cancelledReservations',
    'pendingParticipants',
    'confirmedParticipants',
    'boardedParticipants',
    'noShowParticipants',
    'unrecordedParticipants',
  ] as const;
  for (const key of keys) totals[key] += row[key];
}

@Injectable()
export class SupplierDashboardService {
  constructor(private readonly repository: ReservationRepository) {}

  async get(supplierId: string, query: DashboardQueryDto) {
    const days = (Date.parse(query.to) - Date.parse(query.from)) / 86400000;
    if (!Number.isFinite(days) || days < 0 || days > 92) {
      throw new BadRequestException(
        'Escolha um período de até 93 dias, com início anterior ou igual ao fim.'
      );
    }
    const rows = await this.repository.dashboard(supplierId, query);
    const totals = emptyTotals();
    const groups = new Map<
      string,
      { date: string; productId: string; productName: string; totals: Totals }
    >();
    for (const row of rows) {
      addRow(totals, row);
      const key = `${row.date}:${row.productId}`;
      if (!groups.has(key))
        groups.set(key, {
          date: row.date,
          productId: row.productId,
          productName: row.productName,
          totals: emptyTotals(),
        });
      addRow(groups.get(key)!.totals, row);
    }
    return {
      from: query.from,
      to: query.to,
      totals,
      byDateAndProduct: [...groups.values()],
    };
  }
}
