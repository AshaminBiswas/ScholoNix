import "server-only";
import { ServiceUnavailableError } from "@/lib/errors";
import type { ObjectStorageAdapter, RetrievedObject, StoredObjectResult } from "./types";

/**
 * Future Cloudflare R2 (S3-compatible) storage adapter boundary.
 * To enable R2 later, install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`,
 * implement put/get/signedUrl/delete using `OBJECT_STORAGE_*`, and set `STORAGE_PROVIDER=r2`.
 */
export function createR2StorageAdapter(): ObjectStorageAdapter {
  const hasConfig = Boolean(
    process.env.OBJECT_STORAGE_ENDPOINT?.trim() &&
      process.env.OBJECT_STORAGE_BUCKET?.trim() &&
      process.env.OBJECT_STORAGE_ACCESS_KEY?.trim() &&
      process.env.OBJECT_STORAGE_SECRET_KEY?.trim(),
  );

  const notReady = (): never => {
    throw new ServiceUnavailableError(
      "Cloudflare R2 storage adapter is reserved for future migration. Set STORAGE_PROVIDER=imagekit for active cloud storage.",
    );
  };

  return {
    provider: "r2",
    isConfigured: () => hasConfig,
    putObject: async (): Promise<StoredObjectResult> => notReady(),
    getObject: async (): Promise<RetrievedObject | null> => notReady(),
    getSignedUrl: async () => notReady(),
    deleteObject: async (): Promise<void> => notReady(),
  };
}
