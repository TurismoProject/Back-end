import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BucketItemFromList, Client } from 'minio';

@Injectable()
export class BucketService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private buckets: BucketItemFromList[] = [];

  async onModuleInit() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });

    this.buckets = await this.client.listBuckets();
  }

  onModuleDestroy() {
    delete this.client;
    return;
  }

  getClient() {
    return this.client;
  }

  async createBucket(bucketName: string) {
    const date = new Date();
    await this.client.makeBucket(bucketName);
    this.buckets.push({ name: bucketName, creationDate: date });
    return;
  }

  async deleteBucket(bucketName: string) {
    await this.client.removeBucket(bucketName);
    this.buckets = this.buckets.filter((bucket) => bucket.name !== bucketName);
    return;
  }
}
