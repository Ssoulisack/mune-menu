import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { seasonColumns } from "./dto";
import { isInSeason } from "../../shared/theme";

/** Today's date as "MM-DD" in the restaurant's timezone. */
export function todayMonthDay(timezone: string, now = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, month: "2-digit", day: "2-digit" }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "2-digit", day: "2-digit" }).formatToParts(now);
  }
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("month")}-${get("day")}`;
}

/** The first enabled season whose date range contains today (lowest id wins on overlap). */
export async function findActiveSeason(db: DrizzleD1Database<typeof schema>, timezone: string) {
  const today = todayMonthDay(timezone);
  const rows = await db.select(seasonColumns).from(schema.seasons).where(eq(schema.seasons.isActive, true)).orderBy(schema.seasons.id);
  return rows.find((s) => isInSeason(today, s.startDate, s.endDate)) ?? null;
}
