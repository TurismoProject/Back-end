import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user.module';
import { ProductsModule } from '@modules/products.module';
import { SupplierModule } from '@modules/supplier.module';
import { AdminModule } from '@modules/admin.module';
import { AuthModule } from '@modules/auth.module';

@Module({
  imports: [
    AdminModule,
    UserModule,
    ProductsModule,
    SupplierModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
