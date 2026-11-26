import "server-only";
import type { ObjectStorageAdapter, PutObjectInput, RetrievedObject, StoredObjectResult } from "./types";

const memoryStore = new Map<string, RetrievedObject>();

/** Ephemeral in-memory object store reserved strictly for automated tests. */
export function createMemoryStorageAdapter(): ObjectStorageAdapter {
  return {
    provider: "memory",
    isConfigured: () => true,

    async putObject(input: PutObjectInput): Promise<StoredObjectResult> {
      memoryStore.set(input.storageKey, {
        buffer: input.buffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        versionTag: input.versionTag,
        provider: "memory",
      });
      return {
        storageKey: input.storageKey,
        provider: "memory",
        sizeBytes: input.buffer.length,
        mimeType: input.mimeType,
        fileName: input.fileName,
        versionTag: input.versionTag,
      };
    },

    async getObject(storageKey: string): Promise<RetrievedObject | null> {
      return memoryStore.get(storageKey) ?? null;
    },

    async deleteObject(storageKey: string): Promise<void> {
      memoryStore.delete(storageKey);
    },
  };
}
