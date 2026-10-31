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
