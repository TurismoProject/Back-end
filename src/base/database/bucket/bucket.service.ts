import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BucketItemFromList, Client } from 'minio';

@Injectable()
export class BucketService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private buckets: BucketItemFromList[] = [];
  private readonly BUCKET_NAME = process.env.PUBLIC_BUCKET_NAME;

  async onModuleInit() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });

    const bucketExists = await this.client.bucketExists(this.BUCKET_NAME);
    if (!bucketExists) {
      await this.client.makeBucket(this.BUCKET_NAME);
      // Set bucket policy to public
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.BUCKET_NAME}/*`],
          },
        ],
      };

      await this.client.setBucketPolicy(
        this.BUCKET_NAME,
        JSON.stringify(policy)
      );
    }
  }

  onModuleDestroy() {
    delete this.client;
    return;
  }

  getClient() {
    return this.client;
  }
}
