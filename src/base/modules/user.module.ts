import { Module } from '@nestjs/common';
import { DatabaseModule } from '@modules/database.module';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';
import { UserRepository } from '@repositories/user/user.repository';
import { UserController } from '@controllers/user.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [{ provide: AbstractUserRepository, useClass: UserRepository }],
})
export class UserModule {}
