import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ObjectStorageAdapter, PutObjectInput, RetrievedObject, StoredObjectResult } from "./types";

const PRIMARY_LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");
const TEMP_FALLBACK_ROOT = path.join(os.tmpdir(), "scholonix-uploads");

function resolveWritablePath(storageKey: string, rootDir: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolvedRoot = path.resolve(rootDir);
  const target = path.resolve(resolvedRoot, normalized);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Invalid local storage key.");
  }
  return target;
}

function readFromRoot(rootDir: string, storageKey: string): RetrievedObject | null {
  const targetPath = resolveWritablePath(storageKey, rootDir);
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  const buffer = fs.readFileSync(targetPath);
  let mimeType = "application/octet-stream";
  let fileName = path.basename(targetPath);
  let versionTag: string | undefined;

  const metaPath = `${targetPath}.meta.json`;
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as {
        mimeType?: string;
        fileName?: string;
        versionTag?: string;
      };
      if (meta.mimeType) mimeType = meta.mimeType;
      if (meta.fileName) fileName = meta.fileName;
      if (meta.versionTag) versionTag = meta.versionTag;
    } catch {
      // Ignore corrupt sidecar metadata
    }
  }

  return {
    buffer,
    mimeType,
    fileName,
    versionTag,
    provider: "local",
  };
}

function writeToRoot(rootDir: string, input: PutObjectInput): void {
  const targetPath = resolveWritablePath(input.storageKey, rootDir);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, input.buffer);
  fs.writeFileSync(
    `${targetPath}.meta.json`,
    JSON.stringify({
      mimeType: input.mimeType,
      fileName: input.fileName,
      versionTag: input.versionTag,
    }),
    "utf8",
  );
}

/**
 * Local development disk adapter with automatic OS temp fallback
 * when the project working directory is read-only.
 */
export function createLocalStorageAdapter(): ObjectStorageAdapter {
  return {
    provider: "local",
    isConfigured: () => true,

    async putObject(input: PutObjectInput): Promise<StoredObjectResult> {
      try {
        writeToRoot(PRIMARY_LOCAL_ROOT, input);
      } catch {
        writeToRoot(TEMP_FALLBACK_ROOT, input);
      }
      return {
        storageKey: input.storageKey,
        provider: "local",
        sizeBytes: input.buffer.length,
        mimeType: input.mimeType,
        fileName: input.fileName,
        versionTag: input.versionTag,
      };
    },

    async getObject(storageKey: string): Promise<RetrievedObject | null> {
      return readFromRoot(PRIMARY_LOCAL_ROOT, storageKey) ?? readFromRoot(TEMP_FALLBACK_ROOT, storageKey);
    },

    async deleteObject(storageKey: string): Promise<void> {
      for (const rootDir of [PRIMARY_LOCAL_ROOT, TEMP_FALLBACK_ROOT]) {
        const target = resolveWritablePath(storageKey, rootDir);
        if (fs.existsSync(target)) fs.unlinkSync(target);
        if (fs.existsSync(`${target}.meta.json`)) fs.unlinkSync(`${target}.meta.json`);
      }
    },
  };
}
