import { BadRequestException, Injectable } from '@nestjs/common';
import { DashboardQueryDto } from './dto/reservation.dto';
import { DashboardRow, ReservationRepository } from './reservation.repository';

/**
 * Cria acumuladores independentes para não compartilhar totais entre grupos do painel.
 */
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

/**
 * Acumula uma saída; só conta participação efetiva quando o passeio estiver concluído.
 *
 * Um embarque registrado em saída ainda agendada não integra completedParticipants.
 * As quantidades representam participações, não pessoas únicas entre passeios.
 */
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

/**
 * Agrupa indicadores do fornecedor por dia local e passeio, sem expor listas de turistas.
 */
@Injectable()
export class SupplierDashboardService {
  constructor(private readonly repository: ReservationRepository) {}

  /**
   * Consolida o período inclusivo em totais gerais e grupos por data/passeio.
   *
   * @param supplierId Fornecedor autenticado, obrigatório no escopo da consulta.
   * @param query Datas locais de início/fim e filtro opcional de produto.
   * @remarks A data de cada linha já é calculada pelo repository no fuso da saída.
   * @throws {BadRequestException} Se o período estiver invertido ou exceder 93 dias.
   */
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
