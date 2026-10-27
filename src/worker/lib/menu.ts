import { and, asc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { categories, items, settings } from "../db/schema";
import { categoryColumns, DEFAULT_SETTINGS, itemColumns, settingsColumns } from "./dto";
import { findActiveSeason } from "./season";
import type { PublicMenu } from "../../shared/types";
import { DEFAULT_THEME } from "../../shared/theme";

/** The customer-facing menu: visible categories/items, sold-out last, and today's theme. */
export async function buildMenu(db: DrizzleD1Database<typeof schema>): Promise<PublicMenu> {
  const [settingsRow, cats, rows] = await Promise.all([
    db.select({ ...settingsColumns, theme: settings.theme }).from(settings).where(eq(settings.id, 1)).get(),
    db.select(categoryColumns).from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db
      .select(itemColumns)
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(and(eq(items.isActive, true), eq(categories.isActive, true)))
      .orderBy(asc(items.sortOrder), asc(items.id)),
  ]);

  const { theme: defaultTheme, ...menuSettings } = settingsRow ?? { ...DEFAULT_SETTINGS, theme: null };
  const season = await findActiveSeason(db, menuSettings.timezone);

  return {
    settings: menuSettings,
    theme: { ...DEFAULT_THEME, ...(season?.theme ?? defaultTheme) },
    season: season && { id: season.id, name: season.name },
    categories: cats
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        translations: cat.translations,
        items: rows
          .filter((i) => i.categoryId === cat.id)
          // Sold-out items sink to the bottom; the admin order is kept within each group (sort is stable).
          .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable))
          .map(({ id, name, description, price, imageKey, isAvailable, translations }) => ({ id, name, description, price, imageKey, isAvailable, translations })),
      }))
      .filter((cat) => cat.items.length > 0),
  };
}
