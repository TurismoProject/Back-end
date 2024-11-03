import { UserController } from '@controllers/user.controller';
import { DatabaseModule } from '@modules/database.module';
import { Module } from '@nestjs/common';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';
import { UserRepository } from '@repositories/user/user.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [{ provide: AbstractUserRepository, useClass: UserRepository }],
  exports:[AbstractUserRepository],
})
export class UserModule {}
