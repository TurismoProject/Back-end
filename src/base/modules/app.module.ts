import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user.module';
import { ProductsModule } from '@modules/products.module';
import { SupplierModule } from '@modules/supplier.module';
import { AdminModule } from '@modules/admin.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/configuration';
import { EmailModule } from './mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    AdminModule,
    UserModule,
    ProductsModule,
    SupplierModule,
    // EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

