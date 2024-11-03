import { Module } from '@nestjs/common';
import { BucketService } from '@database/bucket/bucket.service';

@Module({
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
