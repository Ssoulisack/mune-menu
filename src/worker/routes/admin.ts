import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { asc, eq, sql } from "drizzle-orm";
import { categories, items, seasons, settings } from "../db/schema";
import { categoryColumns, DEFAULT_SETTINGS, itemColumns, seasonColumns, settingsColumns } from "../lib/dto";
import { itemOptionsSchema, langCode, monthDay, optionalText, themeSchema, translationsSchema } from "../lib/validation";
import { findActiveSeason } from "../lib/season";
import { buildMenu } from "../lib/menu";
import { DEFAULT_THEME, type MenuTheme } from "../../shared/theme";
import type { LangCode } from "../../shared/i18n";
import type { MediaDTO } from "../../shared/types";
import { purgeMenuCache } from "../lib/cache";
import { ALLOWED_IMAGE_TYPES, imageStore, MAX_IMAGE_BYTES, PHOTO_PREFIX } from "../lib/images";
import { requireAccess } from "../middleware/access";
import type { AppEnv } from "../env";

export const adminRoutes = new Hono<AppEnv>().basePath("/api/admin");

adminRoutes.use("*", requireAccess);

// Any successful write invalidates the cached public menu.
adminRoutes.use("*", async (c, next) => {
  await next();
  if (c.req.method !== "GET" && c.res.ok) c.executionCtx.waitUntil(purgeMenuCache());
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

adminRoutes.get("/me", (c) => c.json({ email: c.get("adminEmail") }));

// Same data as the public menu, but never cached, for the backoffice live preview.
adminRoutes.get("/preview-menu", async (c) => c.json(await buildMenu(c.get("db")), 200, { "Cache-Control": "no-store" }));

// ---- Settings ----

const settingsBody = z
  .object({
    restaurantName: z.string().trim().min(1).max(120),
    tagline: optionalText,
    logoKey: optionalText,
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
    phone: optionalText,
    address: optionalText,
    openingHours: optionalText,
    defaultLanguage: langCode,
    languages: z.array(langCode).min(1),
    timezone: z.string().trim().min(1).max(64),
    translations: translationsSchema({ restaurantName: 120, tagline: 200, address: 300, openingHours: 200 }),
  })
  .refine((s) => s.languages.includes(s.defaultLanguage), { message: "The default language must be enabled", path: ["defaultLanguage"] })
  .transform((s) => ({ ...s, defaultLanguage: s.defaultLanguage as LangCode, languages: [...new Set(s.languages)] as LangCode[] }));

adminRoutes.get("/settings", async (c) => {
  const row = await c.get("db").select(settingsColumns).from(settings).where(eq(settings.id, 1)).get();
  return c.json(row ?? DEFAULT_SETTINGS);
});

adminRoutes.put("/settings", zValidator("json", settingsBody), async (c) => {
  const body = c.req.valid("json");
  const db = c.get("db");
  const old = await db.select({ logoKey: settings.logoKey }).from(settings).where(eq(settings.id, 1)).get();
  try {
    new Intl.DateTimeFormat("en", { timeZone: body.timezone });
  } catch {
    throw new HTTPException(400, { message: `Unknown timezone "${body.timezone}"` });
  }
  const row = await db
    .insert(settings)
    .values({ id: 1, ...body })
    .onConflictDoUpdate({ target: settings.id, set: { ...body, updatedAt: sql`(unixepoch())` } })
    .returning(settingsColumns)
    .get();
  if (old?.logoKey && old.logoKey !== body.logoKey) c.executionCtx.waitUntil(imageStore(c.env).delete(old.logoKey));
  return c.json(row);
});

// ---- Theme & seasons ----

// Default theme, used when no season is running.
adminRoutes.get("/theme", async (c) => {
  const row = await c.get("db").select({ theme: settings.theme }).from(settings).where(eq(settings.id, 1)).get();
  return c.json({ ...DEFAULT_THEME, ...row?.theme });
});

adminRoutes.put("/theme", zValidator("json", themeSchema), async (c) => {
  const theme = c.req.valid("json") as MenuTheme;
  await c
    .get("db")
    .insert(settings)
    .values({ id: 1, theme })
    .onConflictDoUpdate({ target: settings.id, set: { theme, updatedAt: sql`(unixepoch())` } });
  return c.json(theme);
});

// Update schemas (`*Fields.partial()`) must not have defaults: a default would overwrite
// fields the client didn't send, e.g. toggling visibility would wipe translations.
const seasonFields = z.object({
  name: z.string().trim().min(1).max(80),
  startDate: monthDay,
  endDate: monthDay,
  isActive: z.boolean(),
  theme: themeSchema,
});
const seasonCreate = seasonFields.extend({ isActive: z.boolean().default(true) });

adminRoutes.get("/seasons", async (c) => {
  const db = c.get("db");
  const tz = (await db.select({ tz: settings.timezone }).from(settings).where(eq(settings.id, 1)).get())?.tz ?? DEFAULT_SETTINGS.timezone;
  const [rows, active] = await Promise.all([db.select(seasonColumns).from(seasons).orderBy(asc(seasons.startDate)), findActiveSeason(db, tz)]);
  return c.json({ seasons: rows, activeSeasonId: active?.id ?? null });
});

adminRoutes.get("/seasons/:id", zValidator("param", idParam), async (c) => {
  const row = await c.get("db").select(seasonColumns).from(seasons).where(eq(seasons.id, c.req.valid("param").id)).get();
  if (!row) throw new HTTPException(404, { message: "Season not found" });
  return c.json(row);
});

adminRoutes.post("/seasons", zValidator("json", seasonCreate), async (c) => {
  const body = c.req.valid("json");
  const row = await c.get("db").insert(seasons).values({ ...body, theme: body.theme as MenuTheme }).returning(seasonColumns).get();
  return c.json(row, 201);
});

adminRoutes.put("/seasons/:id", zValidator("param", idParam), zValidator("json", seasonFields.partial()), async (c) => {
  const body = c.req.valid("json");
  const row = await c
    .get("db")
    .update(seasons)
    .set({ ...body, theme: body.theme as MenuTheme | undefined, updatedAt: sql`(unixepoch())` })
    .where(eq(seasons.id, c.req.valid("param").id))
    .returning(seasonColumns)
    .get();
  if (!row) throw new HTTPException(404, { message: "Season not found" });
  return c.json(row);
});

adminRoutes.delete("/seasons/:id", zValidator("param", idParam), async (c) => {
  const row = await c.get("db").delete(seasons).where(eq(seasons.id, c.req.valid("param").id)).returning({ id: seasons.id }).get();
  if (!row) throw new HTTPException(404, { message: "Season not found" });
  return c.json({ ok: true });
});

// ---- Categories ----

const categoryFields = z.object({
  name: z.string().trim().min(1).max(80),
  isActive: z.boolean(),
  translations: translationsSchema({ name: 80 }),
});
const categoryCreate = categoryFields.extend({
  isActive: z.boolean().default(true),
  translations: translationsSchema({ name: 80 }).default({}),
});

adminRoutes.get("/categories", async (c) => {
  const rows = await c.get("db").select(categoryColumns).from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return c.json(rows);
});

adminRoutes.post("/categories", zValidator("json", categoryCreate), async (c) => {
  const db = c.get("db");
  const { next } = (await db.select({ next: sql<number>`coalesce(max(${categories.sortOrder}), -1) + 1` }).from(categories).get())!;
  const row = await db.insert(categories).values({ ...c.req.valid("json"), sortOrder: next }).returning(categoryColumns).get();
  return c.json(row, 201);
});

adminRoutes.put("/categories/reorder", zValidator("json", z.object({ ids: z.array(z.number().int()).min(1) })), async (c) => {
  const db = c.get("db");
  const { ids } = c.req.valid("json");
  const [first, ...rest] = ids.map((id, i) => db.update(categories).set({ sortOrder: i }).where(eq(categories.id, id)));
  await db.batch([first, ...rest]);
  return c.json({ ok: true });
});

adminRoutes.put("/categories/:id", zValidator("param", idParam), zValidator("json", categoryFields.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const row = await c
    .get("db")
    .update(categories)
    .set({ ...c.req.valid("json"), updatedAt: sql`(unixepoch())` })
    .where(eq(categories.id, id))
    .returning(categoryColumns)
    .get();
  if (!row) throw new HTTPException(404, { message: "Category not found" });
  return c.json(row);
});

adminRoutes.delete("/categories/:id", zValidator("param", idParam), async (c) => {
  const { id } = c.req.valid("param");
  const db = c.get("db");
  const imageKeys = await db.select({ key: items.imageKey }).from(items).where(eq(items.categoryId, id));
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id }).get();
  if (!deleted) throw new HTTPException(404, { message: "Category not found" });
  // Items cascade in SQL; clean up their photos too.
  const store = imageStore(c.env);
  c.executionCtx.waitUntil(Promise.all(imageKeys.filter((r) => r.key).map((r) => store.delete(r.key!))));
  return c.json({ ok: true });
});

// ---- Items ----

const itemFields = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  description: optionalText,
  price: z.number().int().min(0),
  imageKey: optionalText,
  isAvailable: z.boolean(),
  isActive: z.boolean(),
  translations: translationsSchema({ name: 120, description: 1000 }),
  options: itemOptionsSchema,
});
const itemCreate = itemFields.extend({
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  translations: translationsSchema({ name: 120, description: 1000 }).default({}),
  options: itemOptionsSchema.default([]),
});

// With options, the item's own price is the cheapest option (used for sorting and "from" prices).
const withOptionPrice = <T extends { price?: number; options?: { price: number }[] }>(body: T): T =>
  body.options?.length ? { ...body, price: Math.min(...body.options.map((o) => o.price)) } : body;

adminRoutes.get("/items", zValidator("query", z.object({ categoryId: z.coerce.number().int().optional() })), async (c) => {
  const { categoryId } = c.req.valid("query");
  const rows = await c
    .get("db")
    .select(itemColumns)
    .from(items)
    .where(categoryId ? eq(items.categoryId, categoryId) : undefined)
    .orderBy(asc(items.categoryId), asc(items.sortOrder), asc(items.id));
  return c.json(rows);
});

adminRoutes.get("/items/:id", zValidator("param", idParam), async (c) => {
  const row = await c.get("db").select(itemColumns).from(items).where(eq(items.id, c.req.valid("param").id)).get();
  if (!row) throw new HTTPException(404, { message: "Item not found" });
  return c.json(row);
});

adminRoutes.post("/items", zValidator("json", itemCreate), async (c) => {
  const body = withOptionPrice(c.req.valid("json"));
  const db = c.get("db");
  const { next } = (await db
    .select({ next: sql<number>`coalesce(max(${items.sortOrder}), -1) + 1` })
    .from(items)
    .where(eq(items.categoryId, body.categoryId))
    .get())!;
  const row = await db.insert(items).values({ ...body, sortOrder: next }).returning(itemColumns).get();
  return c.json(row, 201);
});

adminRoutes.put("/items/reorder", zValidator("json", z.object({ ids: z.array(z.number().int()).min(1) })), async (c) => {
  const db = c.get("db");
  const [first, ...rest] = c.req.valid("json").ids.map((id, i) => db.update(items).set({ sortOrder: i }).where(eq(items.id, id)));
  await db.batch([first, ...rest]);
  return c.json({ ok: true });
});

adminRoutes.put("/items/:id", zValidator("param", idParam), zValidator("json", itemFields.partial()), async (c) => {
  const { id } = c.req.valid("param");
  const body = withOptionPrice(c.req.valid("json"));
  const db = c.get("db");
  const old = await db.select({ imageKey: items.imageKey }).from(items).where(eq(items.id, id)).get();
  if (!old) throw new HTTPException(404, { message: "Item not found" });
  const row = await db
    .update(items)
    .set({ ...body, updatedAt: sql`(unixepoch())` })
    .where(eq(items.id, id))
    .returning(itemColumns)
    .get();
  if (body.imageKey !== undefined && old.imageKey && old.imageKey !== body.imageKey) {
    c.executionCtx.waitUntil(imageStore(c.env).delete(old.imageKey));
  }
  return c.json(row);
});

adminRoutes.patch(
  "/items/:id/availability",
  zValidator("param", idParam),
  zValidator("json", z.object({ isAvailable: z.boolean() })),
  async (c) => {
    const row = await c
      .get("db")
      .update(items)
      .set({ isAvailable: c.req.valid("json").isAvailable, updatedAt: sql`(unixepoch())` })
      .where(eq(items.id, c.req.valid("param").id))
      .returning(itemColumns)
      .get();
    if (!row) throw new HTTPException(404, { message: "Item not found" });
    return c.json(row);
  },
);

adminRoutes.delete("/items/:id", zValidator("param", idParam), async (c) => {
  const row = await c.get("db").delete(items).where(eq(items.id, c.req.valid("param").id)).returning({ imageKey: items.imageKey }).get();
  if (!row) throw new HTTPException(404, { message: "Item not found" });
  if (row.imageKey) c.executionCtx.waitUntil(imageStore(c.env).delete(row.imageKey));
  return c.json({ ok: true });
});

// ---- Uploads ----

adminRoutes.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) throw new HTTPException(400, { message: "Expected a 'file' field" });
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new HTTPException(415, { message: "Use a WebP, JPEG or PNG image" });
  if (file.size > MAX_IMAGE_BYTES) throw new HTTPException(413, { message: "Image is larger than 2 MB" });

  const ext = file.type.split("/")[1];
  const key = `photos/${crypto.randomUUID()}.${ext}`;
  await imageStore(c.env).put(key, await file.arrayBuffer(), file.type);
  return c.json({ key }, 201);
});

// ---- Media (every stored photo) ----

/** Which photos are in use, and by what: item photos, the logo, and theme header photos. */
async function imageUsage(db: AppEnv["Variables"]["db"]) {
  const [itemRows, settingsRow, seasonRows] = await Promise.all([
    db.select({ name: items.name, key: items.imageKey }).from(items),
    db.select({ logoKey: settings.logoKey, theme: settings.theme }).from(settings).where(eq(settings.id, 1)).get(),
    db.select({ name: seasons.name, theme: seasons.theme }).from(seasons),
  ]);
  const usage = new Map<string, string[]>();
  const add = (key: string | null | undefined, label: string) => {
    if (key) usage.set(key, [...(usage.get(key) ?? []), label]);
  };
  for (const row of itemRows) add(row.key, `Item: ${row.name}`);
  add(settingsRow?.logoKey, "Logo");
  add(settingsRow?.theme?.headerImageKey, "Default theme (header photo)");
  for (const row of seasonRows) add(row.theme?.headerImageKey, `Season: ${row.name} (header photo)`);
  return usage;
}

adminRoutes.get("/media", async (c) => {
  const [stored, usage] = await Promise.all([imageStore(c.env).list(), imageUsage(c.get("db"))]);
  const media: MediaDTO[] = stored
    .map((img) => ({ ...img, usedBy: usage.get(img.key) ?? [] }))
    // Newest first; photos without a date (older uploads) last.
    .sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
  return c.json(media);
});

// Deletes photos that nothing uses. Photos still in use are refused, so the menu never shows a broken image.
adminRoutes.post(
  "/media/delete",
  zValidator("json", z.object({ keys: z.array(z.string().startsWith(PHOTO_PREFIX).max(200)).min(1).max(200) })),
  async (c) => {
    const { keys } = c.req.valid("json");
    const usage = await imageUsage(c.get("db"));
    const inUse = keys.filter((k) => usage.has(k));
    if (inUse.length) throw new HTTPException(409, { message: `Still in use: ${inUse.map((k) => usage.get(k)!.join(", ")).join("; ")}` });
    const store = imageStore(c.env);
    await Promise.all(keys.map((k) => store.delete(k)));
    return c.json({ deleted: keys.length });
  },
);
