import "server-only";
import path from "node:path";
import ImageKit, { toFile } from "@imagekit/nodejs";
import type {
  ObjectStorageAdapter,
  PutObjectInput,
  RetrievedObject,
  SignedUrlOptions,
  StoredObjectResult,
} from "./types";

export interface ImageKitConfig {
  privateKey: string;
  publicKey: string;
  urlEndpoint: string;
  baseFolder: string;
}

interface ImageKitAssetMeta {
  mimeType?: string;
  fileName?: string;
  versionTag?: string;
}

export interface ImageKitClientLike {
  files: {
    upload: ImageKit["files"]["upload"];
    delete: ImageKit["files"]["delete"];
  };
  assets: {
    list: ImageKit["assets"]["list"];
  };
  helper: {
    buildSrc: ImageKit["helper"]["buildSrc"];
  };
}

let cachedClientKey = "";
let cachedClient: ImageKit | null = null;

function normalizeFolderSegment(folder: string): string {
  const cleaned = `/${folder.replace(/\\/g, "/")}`.replace(/\/+/g, "/").replace(/\/+$/, "");
  return cleaned || "/scholonix";
}

function normalizeStorageKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid object storage key.");
  }
  return normalized;
}

function parseAssetMeta(description: string | undefined): ImageKitAssetMeta {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as ImageKitAssetMeta;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function sanitizeImageKitTags(tags: string[] | undefined): string[] | undefined {
  if (!tags || tags.length === 0) return undefined;
  const cleaned: string[] = [];
  let totalChars = 0;
  for (const tag of tags) {
    const safe = tag.replace(/[%]/g, "_").trim().slice(0, 64);
    if (!safe) continue;
    if (totalChars + safe.length > 480) break;
    cleaned.push(safe);
    totalChars += safe.length;
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Reads validated ImageKit configuration from server/public environment variables. */
export function getImageKitConfig(): ImageKitConfig | null {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim() || "";
  const publicKey = (
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
    ""
  ).trim();
  const urlEndpoint = (
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const baseFolder = normalizeFolderSegment(process.env.IMAGEKIT_BASE_FOLDER || "/scholonix");

  if (!privateKey || !urlEndpoint) {
    return null;
  }

  return { privateKey, publicKey, urlEndpoint, baseFolder };
}

function getDefaultImageKitClient(config: ImageKitConfig): ImageKit {
  if (cachedClient && cachedClientKey === config.privateKey) {
    return cachedClient;
  }
  cachedClient = new ImageKit({ privateKey: config.privateKey });
  cachedClientKey = config.privateKey;
  return cachedClient;
}

function splitImageKitPath(baseFolder: string, storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);
  const dir = path.posix.dirname(normalized);
  const fileName = path.posix.basename(normalized);
  const folder = dir === "." ? baseFolder : `${baseFolder}/${dir}`;
  const fullPath = `${folder}/${fileName}`;
  return { folder, fileName, fullPath };
}

/**
 * ImageKit object storage adapter supporting private tenant files,
 * signed URLs via `@imagekit/nodejs`, and CDN asset optimization.
 */
export function createImageKitStorageAdapter(deps?: {
  config?: ImageKitConfig | null;
  client?: ImageKitClientLike;
  fetcher?: typeof fetch;
}): ObjectStorageAdapter {
  const resolveRuntime = () => {
    const config = deps?.config !== undefined ? deps.config : getImageKitConfig();
    if (!config) return null;
    const client = deps?.client ?? getDefaultImageKitClient(config);
    const fetcher = deps?.fetcher ?? fetch;
    return { config, client, fetcher };
  };

  return {
    provider: "imagekit",

    isConfigured(): boolean {
      return Boolean(deps?.config !== undefined ? deps.config : getImageKitConfig());
    },

    async putObject(input: PutObjectInput): Promise<StoredObjectResult> {
      const runtime = resolveRuntime();
      if (!runtime) {
        throw new Error("ImageKit storage is not configured.");
      }

      const { folder, fileName, fullPath } = splitImageKitPath(
        runtime.config.baseFolder,
        input.storageKey,
      );
      const uploadable = await toFile(input.buffer, fileName, { type: input.mimeType });
      const description = JSON.stringify({
        mimeType: input.mimeType,
        fileName: input.fileName,
        ...(input.versionTag ? { versionTag: input.versionTag } : {}),
      });

      const uploaded = await runtime.client.files.upload({
        file: uploadable,
        fileName,
        folder,
        isPrivateFile: input.isPrivate ?? true,
        useUniqueFileName: false,
        overwriteFile: input.overwrite ?? true,
        description,
        tags: sanitizeImageKitTags(input.tags),
        responseFields: ["isPrivateFile", "tags", "metadata"],
      });

      return {
        storageKey: normalizeStorageKey(input.storageKey),
        provider: "imagekit",
        fileId: uploaded.fileId,
        filePath: uploaded.filePath || fullPath,
        url: uploaded.url,
        sizeBytes: uploaded.size ?? input.buffer.length,
        mimeType: input.mimeType,
        fileName: input.fileName,
        versionTag: input.versionTag,
      };
    },

    async getSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string | null> {
      const runtime = resolveRuntime();
      if (!runtime) return null;

      const { fullPath } = splitImageKitPath(runtime.config.baseFolder, storageKey);
      const queryParameters: Record<string, string> = {
        ...(options?.queryParameters ?? {}),
      };
      if (options?.disposition === "attachment") {
        queryParameters["ik-attachment"] = "true";
      }

      return runtime.client.helper.buildSrc({
        urlEndpoint: runtime.config.urlEndpoint,
        src: fullPath,
        signed: true,
        expiresIn: options?.expiresInSeconds ?? 180,
        ...(Object.keys(queryParameters).length > 0 ? { queryParameters } : {}),
      });
    },

    async getObject(storageKey: string): Promise<RetrievedObject | null> {
      const runtime = resolveRuntime();
      if (!runtime) return null;

      const { folder, fileName, fullPath } = splitImageKitPath(
        runtime.config.baseFolder,
        storageKey,
      );

      let matchedFile: {
        filePath?: string;
        mime?: string;
        name?: string;
        description?: string;
        versionInfo?: { id?: string };
      } | null = null;

      try {
        const assets = await runtime.client.assets.list({
          path: folder,
          type: "file",
          limit: 1,
          searchQuery: `name = "${fileName.replace(/"/g, '\\"')}"`,
        });
        const first = Array.isArray(assets) ? assets[0] : null;
        if (first && "fileId" in first) {
          matchedFile = first;
        }
      } catch {
        // Proceed with direct signed URL lookup to survive DAM search lag
      }

      const targetPath = matchedFile?.filePath || fullPath;
      const versionParam = matchedFile?.versionInfo?.id
        ? { v: matchedFile.versionInfo.id }
        : undefined;

      const signedUrl = runtime.client.helper.buildSrc({
        urlEndpoint: runtime.config.urlEndpoint,
        src: targetPath,
        signed: true,
        expiresIn: 180,
        ...(versionParam ? { queryParameters: versionParam } : {}),
      });

      const res = await runtime.fetcher(signedUrl, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404 || res.status === 401 || res.status === 403) {
          return null;
        }
        throw new Error(`ImageKit fetch failed with status ${res.status}`);
      }

      const arrayBuf = await res.arrayBuffer();
      const meta = parseAssetMeta(matchedFile?.description);

      return {
        buffer: Buffer.from(arrayBuf),
        mimeType:
          meta.mimeType ||
          matchedFile?.mime ||
          res.headers.get("content-type")?.split(";")[0]?.trim() ||
          "application/octet-stream",
        fileName: meta.fileName || matchedFile?.name || fileName,
        versionTag: meta.versionTag,
        provider: "imagekit",
        signedUrl,
      };
    },

    async deleteObject(storageKey: string): Promise<void> {
      const runtime = resolveRuntime();
      if (!runtime) return;

      const { folder, fileName } = splitImageKitPath(runtime.config.baseFolder, storageKey);
      const assets = await runtime.client.assets.list({
        path: folder,
        type: "file",
        limit: 5,
        searchQuery: `name = "${fileName.replace(/"/g, '\\"')}"`,
      });
      for (const entry of assets) {
        if ("fileId" in entry && entry.fileId) {
          await runtime.client.files.delete(entry.fileId);
        }
      }
    },
  };
}
