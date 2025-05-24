import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ProductsController } from '@controllers/products.controller';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import { ProductsRepository } from '@repositories/products/products.repository';
import { BucketModule } from './bucket.module';
import { FileService } from '@services/file.service';
import { ProductImageService } from '@services/product-image.service';

@Module({
  imports: [DatabaseModule, BucketModule],
  controllers: [ProductsController],
  providers: [
    FileService,
    ProductImageService,
    { provide: AbstractProductsRepository, useClass: ProductsRepository },
    { provide: 'Repository', useClass: ProductsRepository },
  ],
  exports: [AbstractProductsRepository],
})
export class ProductsModule {}
