import { AuthModule } from './auth.module';
import { ReservationAccessGuard } from '../../reservations/auth/reservation-access.guard';
import { SupplierAuthenticationService } from '../../reservations/auth/supplier-authentication.service';
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { SupplierController } from '@controllers/supplier.controller';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { SupplierRepository } from '@repositories/suppliers/supplier.repository';
import { ProductsModule } from './products.module';

@Module({
  imports: [DatabaseModule, ProductsModule, AuthModule],
  controllers: [SupplierController],
  providers: [
    ReservationAccessGuard,
    SupplierAuthenticationService,
    {
      provide: AbstractSupplierRepository,
      useClass: SupplierRepository,
    },
  ],
})
export class SupplierModule {}
