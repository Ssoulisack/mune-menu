import type { Bindings } from "../env";

// Photo storage that works with either R2 (preferred when bound) or Workers KV (no card needed).
export interface ImageStore {
  put(key: string, data: ArrayBuffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream; contentType: string } | null>;
  delete(key: string): Promise<void>;
  /** Every stored photo (for the backoffice Media page). */
  list(): Promise<StoredImage[]>;
}

export interface StoredImage {
  key: string;
  /** Bytes; null for KV photos uploaded before sizes were recorded. */
  size: number | null;
  /** ISO date; null when unknown (same as size). */
  uploadedAt: string | null;
}

/** All uploads live under this prefix. */
export const PHOTO_PREFIX = "photos/";

interface KvPhotoMeta {
  contentType: string;
  size?: number;
  uploadedAt?: string;
}

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"];

export function imageStore(env: Bindings): ImageStore {
  if (env.IMAGES_R2) return r2Store(env.IMAGES_R2);
  if (env.IMAGES_KV) return kvStore(env.IMAGES_KV);
  throw new Error("No image storage bound: add IMAGES_KV or IMAGES_R2 in wrangler.jsonc");
}

function r2Store(bucket: R2Bucket): ImageStore {
  return {
    async put(key, data, contentType) {
      await bucket.put(key, data, { httpMetadata: { contentType } });
    },
    async get(key) {
      const obj = await bucket.get(key);
      if (!obj) return null;
      return { body: obj.body, contentType: obj.httpMetadata?.contentType ?? "application/octet-stream" };
    },
    async delete(key) {
      await bucket.delete(key);
    },
    async list() {
      const out: StoredImage[] = [];
      let cursor: string | undefined;
      do {
        const page = await bucket.list({ prefix: PHOTO_PREFIX, cursor });
        for (const obj of page.objects) out.push({ key: obj.key, size: obj.size, uploadedAt: obj.uploaded.toISOString() });
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
      return out;
    },
  };
}

function kvStore(kv: KVNamespace): ImageStore {
  return {
    async put(key, data, contentType) {
      // Size and date go in the metadata so listing photos doesn't have to read every file.
      await kv.put(key, data, { metadata: { contentType, size: data.byteLength, uploadedAt: new Date().toISOString() } satisfies KvPhotoMeta });
    },
    async get(key) {
      const { value, metadata } = await kv.getWithMetadata<KvPhotoMeta>(key, "stream");
      if (!value) return null;
      return { body: value, contentType: metadata?.contentType ?? "application/octet-stream" };
    },
    async delete(key) {
      await kv.delete(key);
    },
    async list() {
      const out: StoredImage[] = [];
      let cursor: string | undefined;
      do {
        const page = await kv.list<KvPhotoMeta>({ prefix: PHOTO_PREFIX, cursor });
        for (const k of page.keys) out.push({ key: k.name, size: k.metadata?.size ?? null, uploadedAt: k.metadata?.uploadedAt ?? null });
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return out;
    },
  };
}
