import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';

@Injectable()
export class BucketService implements OnModuleInit, OnModuleDestroy {
  private bucket: FirebaseStorage;
  protected app: FirebaseApp;

<<<<<<< Updated upstream
  onModuleInit() {
    const app = initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    });
    const storage = getStorage(app);
    this.bucket = storage;
=======
  async onModuleInit() {
    if (!process.env.MINIO_ENDPOINT) {
      console.warn(
        '⚠️ MINIO_ENDPOINT não configurado no .env. Inicialização do MinIO ignorada.',
      );
      return;
    }

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
        JSON.stringify(policy),
      );
    }
>>>>>>> Stashed changes
  }

  onModuleDestroy() {
    this.bucket = null;
    deleteApp(this.app);
    return;
  }

  getBucket() {
    return this.bucket;
  }
}
