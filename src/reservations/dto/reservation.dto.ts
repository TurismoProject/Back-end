import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttendanceStatus,
  DepartureStatus,
  ReservationStatus,
} from '@prisma/client';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CreateDepartureDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: '2027-01-15T09:00:00-03:00' })
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'startsAt deve incluir horário e fuso (Z ou ±HH:mm).',
  })
  startsAt: string;

  @ApiPropertyOptional({ default: 'America/Maceio' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone = 'America/Maceio';

  @ApiProperty({ minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity: number;

  @ApiProperty({
    example: '120.00',
    description: 'Preço por pessoa, em reais.',
  })
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,9})\.\d{2}$/)
  pricePerPerson: string;
}

export class DepartureQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '2027-01-15T00:00:00-03:00',
    description: 'Início inclusivo do intervalo.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/)
  startsFrom?: string;

  @ApiPropertyOptional({
    example: '2027-01-16T00:00:00-03:00',
    description: 'Fim exclusivo do intervalo.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/)
  startsBefore?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ enum: DepartureStatus })
  @IsOptional()
  @IsEnum(DepartureStatus)
  status?: DepartureStatus;
}

export class ParticipantDto {
  @ApiProperty({ example: 'Ana Souza' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;
}

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  departureId: string;

  @ApiProperty({
    description:
      'UUID gerado pelo cliente e reutilizado ao repetir o mesmo pedido.',
  })
  @IsUUID()
  requestKey: string;

  @ApiProperty({ type: [ParticipantDto], maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}

export class ReservationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}

export enum ReservationAction {
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
}

export class ResolveReservationsDto {
  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  reservationIds: string[];

  @ApiProperty({ enum: ReservationAction })
  @IsEnum(ReservationAction)
  action: ReservationAction;

  @ApiPropertyOptional({ description: 'Obrigatório no cancelamento.' })
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}

export class RecordAttendanceDto {
  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  participantIds: string[];

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  attendance: AttendanceStatus;
}

export class ChangeDepartureStatusDto {
  @ApiProperty({ enum: [DepartureStatus.COMPLETED, DepartureStatus.CANCELLED] })
  @IsEnum(DepartureStatus)
  status: DepartureStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}

export class DashboardQueryDto {
  @ApiProperty({ example: '2027-01-01' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from: string;

  @ApiProperty({ example: '2027-01-31' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class CancelReservationDto {
  @ApiProperty()
  @IsString()
  @Length(3, 500)
  reason: string;
}
