import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ClientService } from './client.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [],
})
export class UserModule {}
