import { AdminController } from '@controllers/admin.controller';
import { DatabaseModule } from '@modules/database.module';
import { Module } from '@nestjs/common';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';
import { AdminRepository } from '@repositories/admin/admin.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [{ provide: AbstractAdminRepository, useClass: AdminRepository }],
  exports: [AbstractAdminRepository],
})
export class AdminModule {}
