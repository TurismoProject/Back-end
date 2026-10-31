import { BadRequestException, ConflictException } from '@nestjs/common';
import { DepartureStatus, ReservationStatus } from '@prisma/client';

export function validateTimeZone(timeZone: string): void {
  try {
    if (!/^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/.test(timeZone))
      throw new Error();
    new Intl.DateTimeFormat('pt-BR', { timeZone }).format();
  } catch {
    throw new BadRequestException(
      'Fuso horário inválido. Use um nome IANA, como America/Maceio.'
    );
  }
}

export function requireScheduled(status: DepartureStatus): void {
  if (status !== DepartureStatus.SCHEDULED) {
    throw new ConflictException('A saída já foi concluída ou cancelada.');
  }
}

export function requireBeforeDeparture(startsAt: Date): void {
  if (startsAt.getTime() <= Date.now()) {
    throw new ConflictException('A saída já começou.');
  }
}

export function requireCapacity(
  capacity: number,
  confirmed: number,
  incoming: number
): void {
  if (confirmed + incoming > capacity) {
    throw new ConflictException(
      'A seleção excede a capacidade disponível da saída.'
    );
  }
}

export function requireReason(reason?: string): string {
  const trimmed = reason?.trim();
  if (!trimmed || trimmed.length < 3) {
    throw new BadRequestException(
      'Informe um motivo de cancelamento com pelo menos 3 caracteres.'
    );
  }
  return trimmed;
}

export function requireConfirmable(statuses: ReservationStatus[]): void {
  if (statuses.some((status) => status === ReservationStatus.CANCELLED)) {
    throw new ConflictException(
      'Uma reserva cancelada não pode ser confirmada.'
    );
  }
}
