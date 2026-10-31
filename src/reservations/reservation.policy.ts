import { BadRequestException, ConflictException } from '@nestjs/common';
import { DepartureStatus, ReservationStatus } from '@prisma/client';

/**
 * Valida um nome IANA aceito pelo runtime para o agrupamento local das saídas.
 * @throws {BadRequestException} Se o fuso for inválido ou um offset sem nome IANA.
 */
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

/**
 * Exige uma saída agendada antes de permitir novas alterações de negócio.
 * @throws {ConflictException} Se a saída já tiver sido concluída ou cancelada.
 */
export function requireScheduled(status: DepartureStatus): void {
  if (status !== DepartureStatus.SCHEDULED) {
    throw new ConflictException('A saída já foi concluída ou cancelada.');
  }
}

/**
 * Exige que o início da saída ainda seja futuro em relação ao relógio do servidor.
 * @throws {ConflictException} Se o início já tiver ocorrido.
 */
export function requireBeforeDeparture(startsAt: Date): void {
  if (startsAt.getTime() <= Date.now()) {
    throw new ConflictException('A saída já começou.');
  }
}

/**
 * Valida a soma da ocupação confirmada e dos passageiros que entrarão nela.
 *
 * @param capacity Limite de passageiros da saída.
 * @param confirmed Passageiros de reservas já confirmadas, sem incluir pendentes.
 * @param incoming Passageiros das reservas que passarão a ocupar vagas.
 * @remarks
 * O chamador deve ler a ocupação e gravar a confirmação sob o mesmo bloqueio
 * da saída; esta função isolada não protege contra concorrência.
 * @throws {ConflictException} Se a seleção ultrapassar a capacidade.
 */
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

/**
 * Normaliza e exige um motivo de cancelamento com pelo menos três caracteres.
 * @returns O motivo sem espaços nas extremidades.
 * @throws {BadRequestException} Se o motivo estiver ausente ou insuficiente.
 */
export function requireReason(reason?: string): string {
  const trimmed = reason?.trim();
  if (!trimmed || trimmed.length < 3) {
    throw new BadRequestException(
      'Informe um motivo de cancelamento com pelo menos 3 caracteres.'
    );
  }
  return trimmed;
}

/**
 * Impede reabrir reservas canceladas durante uma confirmação individual ou em massa.
 * @throws {ConflictException} Se a seleção contiver uma reserva cancelada.
 */
export function requireConfirmable(statuses: ReservationStatus[]): void {
  if (statuses.some((status) => status === ReservationStatus.CANCELLED)) {
    throw new ConflictException(
      'Uma reserva cancelada não pode ser confirmada.'
    );
  }
}
