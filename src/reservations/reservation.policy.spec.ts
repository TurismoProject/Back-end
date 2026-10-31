import { BadRequestException, ConflictException } from '@nestjs/common';
import { DepartureStatus, ReservationStatus } from '@prisma/client';
import {
  requireBeforeDeparture,
  requireCapacity,
  requireConfirmable,
  requireReason,
  requireScheduled,
  validateTimeZone,
} from './reservation.policy';

describe('Reservation policies', () => {
  it('allows exact capacity, rejects overflow', () => {
    expect(() => requireCapacity(10, 6, 4)).not.toThrow();
    expect(() => requireCapacity(10, 6, 5)).toThrow(ConflictException);
  });
  it('rejects past departures and closed departures', () => {
    expect(() => requireBeforeDeparture(new Date(Date.now() - 1000))).toThrow(
      ConflictException
    );
    expect(() => requireScheduled(DepartureStatus.CANCELLED)).toThrow(
      ConflictException
    );
    expect(() => requireScheduled(DepartureStatus.COMPLETED)).toThrow(
      ConflictException
    );
  });
  it('does not reopen cancelled reservations', () => {
    expect(() =>
      requireConfirmable([
        ReservationStatus.PENDING,
        ReservationStatus.CANCELLED,
      ])
    ).toThrow(ConflictException);
  });
  it('rejects blank cancellation reasons', () => {
    expect(() => requireReason('   ')).toThrow(BadRequestException);
    expect(requireReason('  Mau tempo  ')).toBe('Mau tempo');
  });
  it('requires valid named time zones', () => {
    expect(() => validateTimeZone('America/Maceio')).not.toThrow();
    expect(() => validateTimeZone('invalid-zone')).toThrow(BadRequestException);
  });
});
