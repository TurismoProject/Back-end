import { Module } from '@nestjs/common';
import { PrismaService } from '@base/database/prisma/prisma.service';
import { BucketService } from '@database/bucket/bucket.service';

@Module({
  providers: [PrismaService, BucketService],
  exports: [PrismaService, BucketService],
})
export class DatabaseModule {}
