import { Readable } from 'stream';

/** Minimal subset of multer's File object used across storage services.
 *  Defined inline so no @types/multer global namespace augmentation is needed.
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path: string;
  buffer?: Buffer;
}

export interface StoredFile {
  fileUrl: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageService {
  saveFile(file: MulterFile): Promise<StoredFile>;
  getFileStream(filePath: string): Readable;
  deleteFile(filePath: string): Promise<boolean>;
  getUrl(filename: string): string;
}
