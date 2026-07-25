import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../shared/config/index.js';
import crypto from 'crypto';

const r2AccountId = env.R2_ACCOUNT_ID;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
const bucketName = env.R2_BUCKET_NAME;

const isProduction = env.NODE_ENV === 'production';
const hasR2Config = r2AccountId && accessKeyId && secretAccessKey && bucketName;

if (isProduction && !hasR2Config) {
  throw new Error('FATAL: Cloudflare R2 config is missing in production environment');
}

let s3Client: S3Client | null = null;

if (hasR2Config) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

export const storage = {
  generateStorageKey(ownerId: string, originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const uuid = crypto.randomUUID();
    return `uploads/${ownerId}/${uuid}.${ext}`;
  },

  async generatePresignedUploadUrl(storageKey: string, mimeType: string, sizeBytes: number): Promise<string> {
    if (!s3Client) {
      // Mock fallback
      return `http://mock-storage.local/upload/${encodeURIComponent(storageKey)}`;
    }
    
    const command = new PutObjectCommand({
      Bucket: bucketName!,
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    });
    
    // Expires in 1 hour
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  },

  async generatePresignedDownloadUrl(storageKey: string, downloadName?: string): Promise<string> {
    if (!s3Client) {
      return `http://mock-storage.local/download/${encodeURIComponent(storageKey)}`;
    }

    const command = new GetObjectCommand({
      Bucket: bucketName!,
      Key: storageKey,
      ResponseContentDisposition: downloadName ? `attachment; filename="${downloadName}"` : undefined
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  },

  async deleteObject(storageKey: string): Promise<void> {
    if (!s3Client) return;
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName!,
      Key: storageKey,
    });

    await s3Client.send(command);
  }
};
