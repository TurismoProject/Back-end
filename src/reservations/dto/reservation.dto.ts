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

/**
 * Paginação compartilhada: página a partir de 1 e limite de até 100 registros.
 * Converte explicitamente números recebidos na query string antes de validá-los.
 */
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

/**
 * Contrato de criação de saída; propriedade, data futura e preço positivo são validados no service.
 * Instantes exigem offset e preços são strings para evitar perda de precisão monetária.
 */
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

/**
 * Filtros do catálogo público e da listagem privada do fornecedor.
 * O intervalo usa início inclusivo e fim exclusivo, permitindo delimitar um dia local.
 */
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

/**
 * Nome de um passageiro previsto, normalizado antes da persistência.
 * O responsável só será passageiro se também constar nessa lista; homônimos são permitidos.
 */
export class ParticipantDto {
  @ApiProperty({ example: 'Ana Souza' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;
}

/**
 * Pedido de reserva sem preço, status ou responsável controláveis pelo cliente.
 * A quantidade de passageiros é derivada da lista, limitada a 100 participantes.
 */
export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  departureId: string;

  /**
   * Identifica o mesmo pedido em reenvios; a unicidade é por usuário, não por saída.
   */
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

/**
 * Paginação de reservas com filtro opcional de situação.
 * O mesmo contrato é usado na consulta de histórico, que considera apenas a paginação.
 */
export class ReservationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}

/**
 * Ações disponíveis para resolver reservas sem reabrir registros cancelados.
 */
export enum ReservationAction {
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
}

/**
 * Seleção atômica de até 100 IDs únicos pertencentes à mesma saída.
 * A exigência condicional de motivo ao cancelar é aplicada pela policy no service.
 */
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

/**
 * Seleção atômica de passageiros para embarque, ausência ou correção.
 * A validação de reserva confirmada, propriedade e janela de horário ocorre no service.
 */
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

/**
 * Solicita um estado final da saída; o service rejeita reabertura para SCHEDULED.
 * Cancelamento exige motivo; conclusão exige reservas e comparecimentos resolvidos.
 */
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

/**
 * Período de datas locais inclusivas para o painel, com produto opcional.
 * O service limita o intervalo a 93 dias e a consulta usa o fuso de cada saída.
 */
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

/**
 * Motivo de cancelamento de uma reserva própria; não permite alterar responsável ou status.
 */
export class CancelReservationDto {
  @ApiProperty()
  @IsString()
  @Length(3, 500)
  reason: string;
}
