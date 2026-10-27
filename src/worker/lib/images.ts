import type { Bindings } from "../env";

// Photo storage that works with either R2 (preferred when bound) or Workers KV (no card needed).
export interface ImageStore {
  put(key: string, data: ArrayBuffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream; contentType: string } | null>;
  delete(key: string): Promise<void>;
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
  };
}

function kvStore(kv: KVNamespace): ImageStore {
  return {
    async put(key, data, contentType) {
      await kv.put(key, data, { metadata: { contentType } });
    },
    async get(key) {
      const { value, metadata } = await kv.getWithMetadata<{ contentType: string }>(key, "stream");
      if (!value) return null;
      return { body: value, contentType: metadata?.contentType ?? "application/octet-stream" };
    },
    async delete(key) {
      await kv.delete(key);
    },
  };
}
