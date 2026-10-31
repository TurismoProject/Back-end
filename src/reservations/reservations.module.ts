import { Module } from '@nestjs/common';
import { DatabaseModule } from '../base/modules/database.module';
import { AuthModule } from '../base/modules/auth.module';
import { ReservationAccessGuard } from './auth/reservation-access.guard';
import { DepartureService } from './departure.service';
import {
  DepartureCatalogController,
  SupplierReservationsController,
  UserReservationsController,
} from './reservation.controller';
import { ReservationRepository } from './reservation.repository';
import { ReservationService } from './reservation.service';
import { SupplierDashboardService } from './supplier-dashboard.service';

/**
 * Agrupa os fluxos de saídas, reservas, participantes e painel do fornecedor.
 *
 * @remarks
 * O código desta funcionalidade fica reunido em `src/reservations`.
 * Controllers tratam HTTP; services aplicam regras de negócio; o repository
 * centraliza consultas e transações. As funções de policy reúnem validações
 * reutilizáveis. DatabaseModule e AuthModule são compartilhados com o legado.
 * @see docs/reservations.md para contratos HTTP, preparação e testes.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    SupplierReservationsController,
    UserReservationsController,
    DepartureCatalogController,
  ],
  providers: [
    ReservationAccessGuard,
    ReservationRepository,
    DepartureService,
    ReservationService,
    SupplierDashboardService,
  ],
})
export class ReservationsModule {}
