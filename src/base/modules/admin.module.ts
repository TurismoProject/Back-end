import { AdminController } from '@controllers/admin.controller';
import { DatabaseModule } from '@modules/database.module';
import { Module } from '@nestjs/common';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';
import { AdminRepository } from '@repositories/admin/admin.repository';
import { AuthModule } from './auth.module';
import { EmailModule } from './email.module';

@Module({
  imports: [DatabaseModule, AuthModule, EmailModule],
  controllers: [AdminController],
  providers: [{ provide: AbstractAdminRepository, useClass: AdminRepository }],
  exports: [],
})
export class AdminModule { }
