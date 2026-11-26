export type StorageProviderName = "imagekit" | "r2" | "local" | "memory";

export interface PutObjectInput {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  isPrivate?: boolean;
  overwrite?: boolean;
  tags?: string[];
  versionTag?: string;
}

export interface StoredObjectResult {
  storageKey: string;
  provider: StorageProviderName;
  fileId?: string;
  filePath?: string;
  url?: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  versionTag?: string;
}

export interface RetrievedObject {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  versionTag?: string;
  provider: StorageProviderName;
  signedUrl?: string;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
  disposition?: "inline" | "attachment";
  downloadFilename?: string;
  queryParameters?: Record<string, string>;
}

/**
 * Provider-agnostic binary object storage contract.
 * Keeps application services decoupled from ImageKit, Cloudflare R2, or local disk.
 */
export interface ObjectStorageAdapter {
  readonly provider: StorageProviderName;
  isConfigured(): boolean;
  putObject(input: PutObjectInput): Promise<StoredObjectResult>;
  getObject(storageKey: string): Promise<RetrievedObject | null>;
  getSignedUrl?(storageKey: string, options?: SignedUrlOptions): Promise<string | null>;
  deleteObject(storageKey: string): Promise<void>;
}
