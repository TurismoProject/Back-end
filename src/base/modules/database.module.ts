import { Module } from '@nestjs/common';
import { PrismaService } from '@base/database/prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
