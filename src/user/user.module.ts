import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserRepository],
  exports: [],
})
export class UserModule {}
