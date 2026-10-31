import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateDepartureDto,
  CreateReservationDto,
  DepartureQueryDto,
  ResolveReservationsDto,
} from './dto/reservation.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const validate = (value: unknown, metatype: ArgumentMetadata['metatype']) =>
  pipe.transform(value, { type: 'body', metatype });

describe('Reservation request validation', () => {
  it('requires named participants and rejects attempts to inject status/price', async () => {
    const input = {
      departureId: randomUUID(),
      requestKey: randomUUID(),
      participants: [{ name: ' Ana Souza ' }],
    };
    const result = await validate(input, CreateReservationDto);
    expect(result.participants[0].name).toBe('Ana Souza');
    await expect(
      validate({ ...input, participants: [] }, CreateReservationDto)
    ).rejects.toThrow(BadRequestException);
    await expect(
      validate(
        { ...input, participants: [{ name: '   ' }] },
        CreateReservationDto
      )
    ).rejects.toThrow(BadRequestException);
    await expect(
      validate({ ...input, status: 'CONFIRMED' }, CreateReservationDto)
    ).rejects.toThrow(BadRequestException);
    await expect(
      validate(
        {
          ...input,
          participants: [{ name: 'Ana Souza', attendance: 'BOARDED' }],
        },
        CreateReservationDto
      )
    ).rejects.toThrow(BadRequestException);
  });
  it('rejects duplicate or excessive bulk IDs', async () => {
    const id = randomUUID();
    await expect(
      validate(
        { reservationIds: [id, id], action: 'CONFIRM' },
        ResolveReservationsDto
      )
    ).rejects.toThrow(BadRequestException);
    await expect(
      validate(
        {
          reservationIds: Array.from({ length: 101 }, () => randomUUID()),
          action: 'CONFIRM',
        },
        ResolveReservationsDto
      )
    ).rejects.toThrow(BadRequestException);
  });
  it('requires an explicit offset and decimal money string', async () => {
    const input = {
      productId: randomUUID(),
      startsAt: '2027-01-15T09:00:00-03:00',
      capacity: 10,
      pricePerPerson: '12.50',
    };
    await expect(validate(input, CreateDepartureDto)).resolves.toBeInstanceOf(
      CreateDepartureDto
    );
    await expect(
      validate(
        { ...input, startsAt: '2027-01-15T09:00:00' },
        CreateDepartureDto
      )
    ).rejects.toThrow(BadRequestException);
    await expect(
      validate({ ...input, pricePerPerson: 12.5 }, CreateDepartureDto)
    ).rejects.toThrow(BadRequestException);
  });
  it('bounds pagination and converts query numbers explicitly', async () => {
    const result = await validate(
      { page: '2', limit: '10' },
      DepartureQueryDto
    );
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    await expect(validate({ limit: 101 }, DepartureQueryDto)).rejects.toThrow(
      BadRequestException
    );
  });
});
