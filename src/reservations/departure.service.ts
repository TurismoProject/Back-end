import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, DepartureStatus, Prisma } from '@prisma/client';
import { ReservationActor } from './auth/reservation-actor';
import {
  ChangeDepartureStatusDto,
  CreateDepartureDto,
  DepartureQueryDto,
} from './dto/reservation.dto';
import { ReservationRepository } from './reservation.repository';
import {
  requireBeforeDeparture,
  requireReason,
  requireScheduled,
  validateTimeZone,
} from './reservation.policy';

@Injectable()
export class DepartureService {
  constructor(private readonly repository: ReservationRepository) {}

  async create(actor: ReservationActor, dto: CreateDepartureDto) {
    validateTimeZone(dto.timeZone);
    requireBeforeDeparture(new Date(dto.startsAt));
    if (new Prisma.Decimal(dto.pricePerPerson).lte(0)) {
      throw new BadRequestException(
        'O preço por pessoa deve ser maior que zero.'
      );
    }
    const product = await this.repository.findOwnedProduct(
      dto.productId,
      actor.id
    );
    if (!product) throw new NotFoundException('Passeio não encontrado.');
    try {
      return await this.repository.createDeparture({
        productId: dto.productId,
        startsAt: new Date(dto.startsAt),
        timeZone: dto.timeZone,
        capacity: dto.capacity,
        pricePerPerson: dto.pricePerPerson,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma saída desse passeio nesse horário.'
        );
      }
      throw error;
    }
  }

  list(query: DepartureQueryDto, supplierId?: string) {
    if (
      query.startsFrom &&
      query.startsBefore &&
      new Date(query.startsFrom) >= new Date(query.startsBefore)
    ) {
      throw new BadRequestException(
        'O início do intervalo deve ser anterior ao fim.'
      );
    }
    return this.repository.listDepartures(query, supplierId);
  }

  async changeStatus(
    actor: ReservationActor,
    departureId: string,
    dto: ChangeDepartureStatusDto
  ) {
    if (dto.status === DepartureStatus.SCHEDULED) {
      throw new BadRequestException('Não é possível reabrir uma saída.');
    }
    return this.repository.withLockedDeparture(
      departureId,
      async (tx, departure) => {
        if (departure.product.supplierId !== actor.id)
          throw new NotFoundException('Saída não encontrada.');
        if (departure.status === dto.status) return departure;
        requireScheduled(departure.status);
        const reservations = await this.repository.activeReservations(
          departureId,
          tx
        );
        if (dto.status === DepartureStatus.COMPLETED) {
          if (departure.startsAt.getTime() > Date.now())
            throw new ConflictException('A saída ainda não começou.');
          if (reservations.some((r) => r.status === 'PENDING')) {
            throw new ConflictException(
              'Resolva as reservas pendentes antes de concluir.'
            );
          }
          if (
            reservations.some((r) =>
              r.participants.some(
                (p) => p.attendance === AttendanceStatus.NOT_RECORDED
              )
            )
          ) {
            throw new ConflictException(
              'Registre o comparecimento de todos os participantes antes de concluir.'
            );
          }
        } else {
          const reason = requireReason(dto.reason);
          if (
            reservations.some((r) =>
              r.participants.some(
                (p) => p.attendance === AttendanceStatus.BOARDED
              )
            )
          ) {
            throw new ConflictException(
              'A saída possui participantes embarcados e não pode ser cancelada.'
            );
          }
          const ids = reservations.map((r) => r.id);
          await this.repository.updateReservations(
            ids,
            {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: reason,
            },
            tx
          );
        }
        await this.repository.recordEvents(
          reservations.map((r) => r.id),
          actor,
          dto.status === DepartureStatus.COMPLETED
            ? 'DEPARTURE_COMPLETED'
            : 'DEPARTURE_CANCELLED',
          { reason: dto.reason?.trim() ?? null },
          tx
        );
        return this.repository.updateDeparture(
          departureId,
          { status: dto.status },
          tx
        );
      }
    );
  }
}
