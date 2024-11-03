import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ProductsController } from '@controllers/products.controller';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import { ProductsRepository } from '@repositories/products/products.repository';
import { BucketModule } from './bucket.module';
import { FileService } from '@services/file.service';

@Module({
  imports: [DatabaseModule, BucketModule],
  controllers: [ProductsController],
  providers: [
    FileService,
    { provide: AbstractProductsRepository, useClass: ProductsRepository },
  ],
  exports: [AbstractProductsRepository],
})
export class ProductsModule {}
