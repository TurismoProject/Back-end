import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ProductsController } from '@controllers/products.controller';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import { ProductsRepository } from '@repositories/products/products.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [
    { provide: AbstractProductsRepository, useClass: ProductsRepository },
  ],
})
export class ProductsModule {}
