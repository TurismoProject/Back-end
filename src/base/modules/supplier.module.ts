import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { SupplierController } from '@controllers/supplier.controller';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { SupplierRepository } from '@repositories/suppliers/supplier.repository';
import { AuthModule } from './auth.module';
import { DashboardService } from '@services/dashboard.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SupplierController],
  providers: [
    DashboardService,
    {
      provide: AbstractSupplierRepository,
      useClass: SupplierRepository,
    },
  ],
})
export class SupplierModule {}
