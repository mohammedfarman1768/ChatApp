import { Router } from 'express';
import { mediaController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { validateData } from '../../middleware/validation.js';
import { 
  CreateUploadSessionSchema, 
  CompleteUploadSchema, 
  AbortUploadSchema, 
  UpdateMediaMetadataSchema, 
  MediaPaginationSchema
} from '@repo/shared-validation';

const router = Router();

// All media routes require authentication and rate limiting
router.use(requireAuth);
router.use(apiRateLimiter);

// Upload lifecycle
router.post('/uploads', csrfMiddleware, validateData(CreateUploadSessionSchema), mediaController.createUploadSession);
router.post('/uploads/complete', csrfMiddleware, validateData(CompleteUploadSchema), mediaController.completeUpload);
router.post('/uploads/abort', csrfMiddleware, validateData(AbortUploadSchema), mediaController.abortUpload);

// File management
router.get('/files', validateData(MediaPaginationSchema, 'query'), mediaController.getFiles);
router.get('/files/:fileId', mediaController.getFile);
router.get('/files/:fileId/metadata', mediaController.getFileMetadata);
router.patch('/files/:fileId', csrfMiddleware, validateData(UpdateMediaMetadataSchema), mediaController.updateMetadata);
router.delete('/files/:fileId', csrfMiddleware, mediaController.deleteFile);

// Access / preview
router.get('/files/:fileId/url', mediaController.getFileUrl);
router.get('/files/:fileId/preview', mediaController.getFilePreview);
router.get('/files/:fileId/download', mediaController.getFileDownload);

export { router as mediaRouter };
