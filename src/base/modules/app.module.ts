import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { ProductsModule } from './products.module';
import { SupplierModule } from './supplier.module';

@Module({
  imports: [UserModule, ProductsModule, SupplierModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
