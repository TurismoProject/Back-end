import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';

@Injectable()
export class BucketService implements OnModuleInit, OnModuleDestroy {
  private bucket: FirebaseStorage;
  protected app: FirebaseApp;

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
