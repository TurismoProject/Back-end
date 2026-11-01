import { ServiceUnavailableException } from '@nestjs/common';
import { deleteApp, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { BucketService } from './bucket.service';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
  deleteApp: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({ name: 'test-storage' })),
}));

const variables = [
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
] as const;

describe('BucketService availability', () => {
  let previousEnvironment: Record<string, string | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    previousEnvironment = Object.fromEntries(
      variables.map((name) => [name, process.env[name]])
    );
    for (const name of variables) delete process.env[name];
  });

  afterEach(() => {
    for (const name of variables) {
      if (previousEnvironment[name] === undefined) delete process.env[name];
      else process.env[name] = previousEnvironment[name];
    }
  });

  it('keeps unrelated modules available and reports missing storage as 503', async () => {
    const service = new BucketService();
    expect(() => service.onModuleInit()).not.toThrow();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(() => service.getBucket()).toThrow(ServiceUnavailableException);
    try {
      service.getBucket();
    } catch (error) {
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    }
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(deleteApp).not.toHaveBeenCalled();
  });

  it('does not initialize storage with a partially configured environment', () => {
    process.env.FIREBASE_API_KEY = 'test-key';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_STORAGE_BUCKET = '   ';
    const service = new BucketService();
    service.onModuleInit();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(() => service.getBucket()).toThrow(ServiceUnavailableException);
  });

  it('uses the configured bucket without requiring optional application metadata', () => {
    process.env.FIREBASE_API_KEY = 'test-key';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_STORAGE_BUCKET = 'test-project.firebasestorage.app';
    const service = new BucketService();
    service.onModuleInit();
    expect(getStorage).toHaveBeenCalledWith({ name: 'test-app' });
    expect(service.getBucket()).toEqual({ name: 'test-storage' });
  });

  it('cleans up the initialized app exactly once', async () => {
    process.env.FIREBASE_API_KEY = 'test-key';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_STORAGE_BUCKET = 'test-project.firebasestorage.app';
    const service = new BucketService();
    service.onModuleInit();
    await service.onModuleDestroy();
    await service.onModuleDestroy();
    expect(deleteApp).toHaveBeenCalledTimes(1);
    expect(deleteApp).toHaveBeenCalledWith({ name: 'test-app' });
    expect(() => service.getBucket()).toThrow(ServiceUnavailableException);
  });
});
