import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentReservationActor,
  ReservationActor,
} from './auth/reservation-actor';
import {
  ReservationAccessGuard,
  ReservationRole,
} from './auth/reservation-access.guard';
import {
  CancelReservationDto,
  ChangeDepartureStatusDto,
  CreateDepartureDto,
  CreateReservationDto,
  DashboardQueryDto,
  DepartureQueryDto,
  RecordAttendanceDto,
  ReservationQueryDto,
  ResolveReservationsDto,
} from './dto/reservation.dto';
import { DepartureService } from './departure.service';
import { ReservationService } from './reservation.service';
import { SupplierDashboardService } from './supplier-dashboard.service';

// Feature-local validation also applies when this module is mounted independently.
const strictValidation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('Reservas do fornecedor')
@ApiBearerAuth()
@Controller('provedor')
@ReservationRole(Role.Supplier)
@UseGuards(ReservationAccessGuard)
@UsePipes(strictValidation)
export class SupplierReservationsController {
  constructor(
    private readonly departures: DepartureService,
    private readonly reservations: ReservationService,
    private readonly dashboard: SupplierDashboardService
  ) {}

  @Post('saidas')
  @ApiOperation({
    summary: 'Criar uma saída de um passeio do fornecedor autenticado',
  })
  createDeparture(
    @CurrentReservationActor() actor: ReservationActor,
    @Body() dto: CreateDepartureDto
  ) {
    return this.departures.create(actor, dto);
  }

  @Get('saidas')
  listDepartures(
    @CurrentReservationActor() actor: ReservationActor,
    @Query() query: DepartureQueryDto
  ) {
    return this.departures.list(query, actor.id);
  }

  @Patch('saidas/:departureId/status')
  changeStatus(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('departureId', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDepartureStatusDto
  ) {
    return this.departures.changeStatus(actor, id, dto);
  }

  @Get('saidas/:departureId/reservas')
  listReservations(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('departureId', ParseUUIDPipe) id: string,
    @Query() query: ReservationQueryDto
  ) {
    return this.reservations.listForSupplier(actor, id, query);
  }

  @Patch('saidas/:departureId/reservas/resolver')
  @ApiOperation({
    summary: 'Confirmar ou cancelar de 1 a 100 reservas atomicamente',
  })
  resolve(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('departureId', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReservationsDto
  ) {
    return this.reservations.resolve(actor, id, dto);
  }

  @Patch('saidas/:departureId/participantes/comparecimento')
  @ApiOperation({
    summary: 'Registrar ou corrigir o comparecimento de 1 a 100 participantes',
  })
  attendance(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('departureId', ParseUUIDPipe) id: string,
    @Body() dto: RecordAttendanceDto
  ) {
    return this.reservations.recordAttendance(actor, id, dto);
  }

  @Get('saidas/:departureId/reservas/:reservationId/historico')
  history(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('departureId', ParseUUIDPipe) departureId: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Query() query: ReservationQueryDto
  ) {
    return this.reservations.history(
      departureId,
      reservationId,
      actor.id,
      query
    );
  }

  @Get('painel/reservas')
  summary(
    @CurrentReservationActor() actor: ReservationActor,
    @Query() query: DashboardQueryDto
  ) {
    return this.dashboard.get(actor.id, query);
  }
}

@ApiTags('Reservas do turista')
@ApiBearerAuth()
@Controller('usuario/reservas')
@ReservationRole(Role.User)
@UseGuards(ReservationAccessGuard)
@UsePipes(strictValidation)
export class UserReservationsController {
  constructor(private readonly reservations: ReservationService) {}

  @Post()
  create(
    @CurrentReservationActor() actor: ReservationActor,
    @Body() dto: CreateReservationDto
  ) {
    return this.reservations.create(actor, dto);
  }

  @Get()
  list(
    @CurrentReservationActor() actor: ReservationActor,
    @Query() query: ReservationQueryDto
  ) {
    return this.reservations.listForUser(actor, query);
  }

  @Get(':id')
  get(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.reservations.getForUser(actor, id);
  }

  @Patch(':id/cancelar')
  cancel(
    @CurrentReservationActor() actor: ReservationActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReservationDto
  ) {
    return this.reservations.cancelForUser(actor, id, dto.reason);
  }
}

@ApiTags('Catálogo de saídas')
@Controller('passeios/saidas')
@UsePipes(strictValidation)
export class DepartureCatalogController {
  constructor(private readonly departures: DepartureService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar saídas e vagas; não retorna nomes de turistas',
  })
  list(@Query() query: DepartureQueryDto) {
    return this.departures.list(query);
  }
}
