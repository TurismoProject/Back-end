import { UserController } from '@controllers/user.controller';
import { DatabaseModule } from '@modules/database.module';
import { Module } from '@nestjs/common';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';
import { UserRepository } from '@repositories/user/user.repository';
import { AuthModule } from '@modules/auth.module';
import { EmailModule } from './email.module';

@Module({
  imports: [DatabaseModule, AuthModule, EmailModule],
  controllers: [UserController],
  providers: [{ provide: AbstractUserRepository, useClass: UserRepository }],
  exports: [],
})
export class UserModule { }
