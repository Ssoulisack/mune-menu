import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import type { LangCode, Translations } from "../../shared/i18n";
import type { MenuTheme } from "../../shared/theme";
import type { InfoField, ItemOption } from "../../shared/types";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
};

// Translations for languages other than the default one, stored as JSON: {"en": {"name": "..."}}
const translations = <F extends string>() =>
  text("translations", { mode: "json" }).$type<Translations<F>>().notNull().default(sql`'{}'`);

// Single row (id = 1) holding restaurant-wide info shown on the public menu.
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull().default("My Café"),
  tagline: text("tagline"),
  logoKey: text("logo_key"),
  currency: text("currency").notNull().default("LAK"),
  phone: text("phone"),
  address: text("address"),
  openingHours: text("opening_hours"),
  defaultLanguage: text("default_language").$type<LangCode>().notNull().default("lo"),
  languages: text("languages", { mode: "json" }).$type<LangCode[]>().notNull().default(sql`'["lo","en"]'`),
  timezone: text("timezone").notNull().default("Asia/Vientiane"),
  translations: translations<InfoField>(),
  // Theme used when no season is running. NULL = built-in default.
  theme: text("theme", { mode: "json" }).$type<MenuTheme>(),
  updatedAt: timestamps.updatedAt,
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    translations: translations<"name">(),
    ...timestamps,
  },
  (t) => [index("categories_sort_idx").on(t.sortOrder)],
);

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    // Stored in the currency's minor unit (whole kip for LAK, cents for USD).
    price: integer("price").notNull(),
    imageKey: text("image_key"),
    // Temporarily sold out: still listed, but greyed out.
    isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
    // Hidden from the public menu entirely.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    translations: translations<"name" | "description">(),
    // Variants with their own price, e.g. [{"name": "Hot", "price": 38000, "translations": {}}].
    options: text("options", { mode: "json" }).$type<ItemOption[]>().notNull().default(sql`'[]'`),
    ...timestamps,
  },
  (t) => [index("items_category_sort_idx").on(t.categoryId, t.sortOrder)],
);

// Seasonal themes: switch on automatically between start and end (MM-DD, yearly).
export const seasons = sqliteTable("seasons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  theme: text("theme", { mode: "json" }).$type<MenuTheme>().notNull(),
  ...timestamps,
});

export type Settings = typeof settings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Season = typeof seasons.$inferSelect;
