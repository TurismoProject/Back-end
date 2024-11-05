import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { ProductsModule } from './products.module';
import { SupplierModule } from './supplier.module';
import { ReviewsModule } from './reviews.module';

@Module({
  imports: [UserModule, ProductsModule, SupplierModule, ReviewsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
