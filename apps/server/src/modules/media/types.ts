

export interface IMediaPagination {
  cursor?: string;
  limit: number;
}

export interface ICreateUploadSession {
  ownerId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ICompleteUploadSession {
  ownerId: string;
  sessionId: string;
}

export interface IUpdateMediaMetadata {
  originalName?: string;
  altText?: string | null;
}

export class MediaError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'MediaError';
  }
}
