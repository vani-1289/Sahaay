import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.service';
import { S3StorageService } from './s3.service';
import { config } from '../config/env';

let storageInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    if (config.STORAGE_PROVIDER === 's3') {
      storageInstance = new S3StorageService();
    } else {
      storageInstance = new LocalStorageService();
    }
  }
  return storageInstance;
}

export * from './storage.interface';
export * from './local.service';
export * from './s3.service';
