import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user.module';
import { ProductsModule } from '@modules/products.module';
import { SupplierModule } from '@modules/supplier.module';
import { AdminModule } from '@modules/admin.module';

@Module({
  imports: [AdminModule, UserModule, ProductsModule, SupplierModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
