import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

const storageDir = process.env.STORAGE_PATH || path.join(process.cwd(), '../storage');
const uploadDir = path.join(storageDir, 'documents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF and image files (JPG, PNG, WebP) are allowed.', 'INVALID_FILE_TYPE') as any);
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10);

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024,
  },
});

/**
 * Validates the magic bytes / file signature against declared MIME types
 */
export const validateFileSignature = (filePath: string, declaredMime: string): boolean => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // PDF: %PDF- (0x25 0x50 0x44 0x46)
    if (declaredMime === 'application/pdf') {
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';
    }

    // JPEG: FF D8 FF
    if (declaredMime === 'image/jpeg') {
      return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }

    // PNG: 89 50 4E 47
    if (declaredMime === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }

    // WebP: RIFF (bytes 0..4) and WEBP (bytes 8..12)
    if (declaredMime === 'image/webp') {
      const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
      const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      return isRiff && isWebp;
    }

    // DOC: D0 CF 11 E0
    if (declaredMime === 'application/msword') {
      return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    }

    // DOCX: 50 4B 03 04 (PK..)
    if (declaredMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Express middleware to enforce magic byte inspection on uploaded files
 */
export const verifyUploadedFileSignature = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const isValid = validateFileSignature(req.file.path, req.file.mimetype);
    if (!isValid) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch {
        // Ignore deletion errors
      }
      return next(
        new BadRequestError('Uploaded file content signature does not match declared type.', 'INVALID_FILE_SIGNATURE')
      );
    }
  }
  next();
};

