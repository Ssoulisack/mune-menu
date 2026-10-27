import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./db/schema";

export interface Bindings {
  DB: D1Database;
  IMAGES_KV?: KVNamespace;
  IMAGES_R2?: R2Bucket;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  DEV_SKIP_AUTH?: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    db: DrizzleD1Database<typeof schema>;
    adminEmail: string;
  };
}
