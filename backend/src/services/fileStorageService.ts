import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Request } from 'express';
import { UPLOAD_DIR, MAX_FILE_SIZE, FILE_SIGNING_SECRET, API_BASE_URL } from '../config/environment';
import logger from '../utils/logger';
import { ValidationError, FileNotFoundError, FileStorageError } from '../utils/errorHandlers';

export async function uploadFile(
  file: Express.Multer.File,
  projectId: number,
  uploadedBy: number
): Promise<{ fileId: string; filePath: string; fileSize: number }> {
  if (!file.buffer || file.buffer.length === 0) {
    throw new ValidationError('File buffer is empty');
  }

  const maxSize = MAX_FILE_SIZE || 10485760;
  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds maximum allowed: ${maxSize} bytes`);
  }

  const fileId = crypto.randomUUID();

  const storageDir = `${UPLOAD_DIR}/project_${projectId}`;

  try {
    await fsPromises.mkdir(storageDir, { recursive: true });
  } catch (error: any) {
    throw new FileStorageError(`Failed to create directory: ${error.message}`);
  }

  const fullFilePath = `${storageDir}/${fileId}_${file.originalname}`;

  try {
    await fsPromises.writeFile(fullFilePath, file.buffer);
  } catch (error: any) {
    throw new FileStorageError(`Failed to write file: ${error.message}`);
  }

  const relativePath = `project_${projectId}/${fileId}_${file.originalname}`;

  logger.info('File uploaded successfully', {
    fileId,
    projectId,
    uploadedBy,
    fileSize: file.size
  });

  return {
    fileId,
    filePath: relativePath,
    fileSize: file.size
  };
}

export async function downloadFile(filePath: string): Promise<Buffer> {
  if (/\.\.\//.test(filePath)) {
    throw new ValidationError('Invalid file path: directory traversal not allowed');
  }

  const fullFilePath = `${UPLOAD_DIR}/${filePath}`;

  try {
    await fsPromises.access(fullFilePath, fs.constants.F_OK);
  } catch (error: any) {
    throw new FileNotFoundError(`File not found: ${filePath}`);
  }

  let buffer: Buffer;
  try {
    buffer = await fsPromises.readFile(fullFilePath);
  } catch (error: any) {
    throw new FileStorageError(`Failed to read file: ${error.message}`);
  }

  logger.info('File downloaded successfully', {
    filePath,
    bufferSize: buffer.length
  });

  return buffer;
}

export async function deleteFile(filePath: string): Promise<void> {
  if (/\.\.\//.test(filePath)) {
    throw new ValidationError('Invalid file path: directory traversal not allowed');
  }

  const fullFilePath = `${UPLOAD_DIR}/${filePath}`;

  try {
    await fsPromises.access(fullFilePath, fs.constants.F_OK);
  } catch (error: any) {
    throw new FileNotFoundError(`File not found: ${filePath}`);
  }

  try {
    await fsPromises.unlink(fullFilePath);
  } catch (error: any) {
    throw new FileStorageError(`Failed to delete file: ${error.message}`);
  }

  logger.info('File deleted successfully', { filePath });
}

export function generateSignedUrl(filePath: string, expiresInMinutes: number = 15): string {
  if (/\.\.\//.test(filePath)) {
    throw new ValidationError('Invalid file path: directory traversal not allowed');
  }

  const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);

  const payload = {
    filePath,
    expiresAt
  };

  const signature = crypto
    .createHmac('sha256', FILE_SIGNING_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signedUrl = `${API_BASE_URL}/attachments/download?token=${encodedPayload}.${signature}`;

  return signedUrl;
}