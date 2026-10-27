import { Hono } from "hono";
import { menuCacheKey } from "../lib/cache";
import { imageStore } from "../lib/images";
import { buildMenu } from "../lib/menu";
import type { AppEnv } from "../env";

export const publicRoutes = new Hono<AppEnv>();

// Browsers must not keep their own copy of the menu: after a deploy, new page code could otherwise
// run on data saved by the old code. The edge copy (below) keeps it fast and is versioned per deploy.
const forBrowser = (res: Response) => {
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "no-cache");
  return out;
};

publicRoutes.get("/api/public/menu", async (c) => {
  const cached = await caches.default.match(menuCacheKey());
  if (cached) return forBrowser(cached);

  const menu = await buildMenu(c.get("db"));

  // Short TTL at the edge (cache.put honours max-age); admin edits also purge it.
  // The short TTL is what lets seasonal themes switch over at midnight without an edit.
  const res = c.json(menu, 200, { "Cache-Control": "public, max-age=30" });
  c.executionCtx.waitUntil(caches.default.put(menuCacheKey(), res.clone()));
  return forBrowser(res);
});

publicRoutes.get("/img/:key{.+}", async (c) => {
  const obj = await imageStore(c.env).get(c.req.param("key"));
  if (!obj) return c.notFound();
  // Keys are random and never reused, so images can be cached forever.
  return new Response(obj.body, {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
});
