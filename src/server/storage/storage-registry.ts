import "server-only";
import { createImageKitStorageAdapter, getImageKitConfig } from "./imagekit-adapter";
import { createLocalStorageAdapter } from "./local-adapter";
import { createMemoryStorageAdapter } from "./memory-adapter";
import { createR2StorageAdapter } from "./r2-adapter";
import type { ObjectStorageAdapter, StorageProviderName } from "./types";

/**
 * Resolves the configured primary storage provider name.
 * Defaults to ImageKit when credentials are configured, memory in test mode,
 * and local temp/disk fallback in unconfigured local dev.
 */
export function resolveStorageProviderName(): StorageProviderName {
  if (process.env.NODE_ENV === "test") {
    return "memory";
  }

  const explicit = (process.env.STORAGE_PROVIDER || "auto").trim().toLowerCase();
  if (explicit === "imagekit") return "imagekit";
  if (explicit === "r2") return "r2";
  if (explicit === "local") return "local";

  if (getImageKitConfig()) {
    return "imagekit";
  }
  return "local";
}

/** Returns the active primary `ObjectStorageAdapter` for tenant files, images, and PDFs. */
export function getObjectStorageAdapter(): ObjectStorageAdapter {
  const provider = resolveStorageProviderName();
  switch (provider) {
    case "memory":
      return createMemoryStorageAdapter();
    case "imagekit":
      return createImageKitStorageAdapter();
    case "r2":
      return createR2StorageAdapter();
    case "local":
    default:
      return createLocalStorageAdapter();
  }
}

export { createImageKitStorageAdapter, getImageKitConfig } from "./imagekit-adapter";
export type * from "./types";
