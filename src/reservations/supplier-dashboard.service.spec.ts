import { BadRequestException } from '@nestjs/common';
import { ReservationRepository } from './reservation.repository';
import { SupplierDashboardService } from './supplier-dashboard.service';

describe('Supplier dashboard', () => {
  const dashboard = jest.fn();
  const service = new SupplierDashboardService({
    dashboard,
  } as unknown as ReservationRepository);
  it('rejects reversed and excessive date ranges before reading the database', async () => {
    await expect(
      service.get('supplier', { from: '2027-02-01', to: '2027-01-01' })
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.get('supplier', { from: '2027-01-01', to: '2027-12-31' })
    ).rejects.toThrow(BadRequestException);
    expect(dashboard).not.toHaveBeenCalled();
  });
  it('distinguishes boarding from participation in a completed tour', async () => {
    const base = {
      date: '2027-01-01',
      productId: 'p',
      productName: 'Barco',
      totalReservations: 1,
      pendingReservations: 0,
      confirmedReservations: 1,
      cancelledReservations: 0,
      pendingParticipants: 0,
      confirmedParticipants: 3,
      boardedParticipants: 2,
      noShowParticipants: 1,
      unrecordedParticipants: 0,
    };
    dashboard.mockResolvedValue([
      { ...base, departureId: 'd1', status: 'SCHEDULED' },
      { ...base, departureId: 'd2', status: 'COMPLETED' },
    ]);
    const result = await service.get('supplier', {
      from: '2027-01-01',
      to: '2027-01-01',
    });
    expect(result.totals.boardedParticipants).toBe(4);
    expect(result.totals.completedParticipants).toBe(2);
    expect(result.byDateAndProduct).toHaveLength(1);
  });
});
