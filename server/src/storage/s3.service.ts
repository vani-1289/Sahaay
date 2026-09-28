import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { Readable, PassThrough } from 'stream';
import { IStorageService, StoredFile } from './storage.interface';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class S3StorageService implements IStorageService {
  private s3: S3Client;
  private bucket: string;
  private publicUrlPrefix?: string;

  constructor() {
    const region = config.AWS_REGION || 'ap-south-1';
    this.bucket = config.AWS_BUCKET_NAME || 'sahaay-documents';
    this.publicUrlPrefix = config.S3_PUBLIC_URL_PREFIX;

    const s3Config: any = {
      region,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY || '',
      },
    };

    if (config.S3_ENDPOINT) {
      s3Config.endpoint = config.S3_ENDPOINT;
      s3Config.forcePathStyle = true; // Required for MinIO / Cloudflare R2 / LocalStack
    }

    this.s3 = new S3Client(s3Config);
    logger.info(`Initialized S3 Storage Service (Bucket: ${this.bucket}, Region: ${region})`);
  }

  async saveFile(file: Express.Multer.File): Promise<StoredFile> {
    const filename = path.basename(file.path || file.filename || file.originalname);
    const key = `documents/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const fileStream = file.buffer
      ? file.buffer
      : fs.readFileSync(file.path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3.send(command);

    // Clean up temporary local upload file if present on disk
    if (file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        logger.warn(`Could not delete temp file ${file.path}:`, err);
      }
    }

    const fileUrl = this.publicUrlPrefix
      ? `${this.publicUrlPrefix.replace(/\/$/, '')}/${key}`
      : `https://${this.bucket}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

    logger.info(`Uploaded file to S3/Cloud Storage: s3://${this.bucket}/${key} -> ${fileUrl}`);

    return {
      fileUrl,
      filePath: key,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  getFileStream(filePath: string): Readable {
    const stream = new PassThrough();
    this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    })).then(response => {
      if (response.Body) {
        (response.Body as Readable).pipe(stream);
      }
    }).catch(err => {
      logger.error(`Error fetching S3 stream for ${filePath}:`, err);
      stream.destroy(err);
    });
    return stream;
  }

  async getPresignedDownloadUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      }));
      logger.info(`Deleted file from S3: ${filePath}`);
      return true;
    } catch (err) {
      logger.error(`Failed to delete S3 file ${filePath}:`, err);
      return false;
    }
  }

  getUrl(filename: string): string {
    if (this.publicUrlPrefix) {
      return `${this.publicUrlPrefix.replace(/\/$/, '')}/${filename}`;
    }
    return `https://${this.bucket}.s3.${config.AWS_REGION}.amazonaws.com/${filename}`;
  }
}
