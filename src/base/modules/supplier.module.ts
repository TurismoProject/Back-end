import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { SupplierController } from '@controllers/supplier.controller';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { SupplierRepository } from '@repositories/suppliers/supplier.repository';
import { ProductsModule } from './products.module';

@Module({
  imports: [DatabaseModule, ProductsModule],
  controllers: [SupplierController],
  providers: [
    {
      provide: AbstractSupplierRepository,
      useClass: SupplierRepository,
    },
  ],
})
export class SupplierModule {}
