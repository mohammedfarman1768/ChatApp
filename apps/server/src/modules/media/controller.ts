import { Request, Response, NextFunction } from 'express';
import { mediaService } from './service.js';
import { MediaError } from './types.js';

export const mediaController = {
  async createUploadSession(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const data = { ownerId, ...req.body };
      const result = await mediaService.createUploadSession(data);
      res.status(201).json({ data: result });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async completeUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const result = await mediaService.completeUpload({ ownerId, ...req.body });
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async abortUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { sessionId } = req.body;
      await mediaService.abortUpload(ownerId, sessionId);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await mediaService.getFiles(ownerId, { cursor, limit });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const result = await mediaService.getFile(ownerId, fileId);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getFileMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const result = await mediaService.getFile(ownerId, fileId);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async updateMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const result = await mediaService.updateMetadata(ownerId, fileId, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      await mediaService.deleteFile(ownerId, fileId);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getFileUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const url = await mediaService.getFileAccessUrl(ownerId, fileId);
      res.status(200).json({ data: { url } });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getFileDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const url = await mediaService.getFileDownloadUrl(ownerId, fileId);
      res.status(200).json({ data: { url } });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getFilePreview(req: Request, res: Response, next: NextFunction) {
    // For now, preview generates the same access URL.
    // In the future, this can point to a thumbnail-specific storage key.
    try {
      const ownerId = (req.user as any).userId;
      const { fileId } = req.params;
      const url = await mediaService.getFileAccessUrl(ownerId, fileId);
      res.status(200).json({ data: { url } });
    } catch (error) {
      if (error instanceof MediaError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
};
