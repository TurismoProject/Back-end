import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user.module';
import { ProductsModule } from './products.module';

@Module({
  imports: [UserModule, ProductsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
