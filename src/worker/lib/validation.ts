import { z } from "zod";
import { isLangCode, LANG_CODES } from "../../shared/i18n";
import { CORNERS, DECORATION_KEYS, FONTS, HEADER_STYLES, LAYOUT_KEYS } from "../../shared/theme";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const optionalText = z.string().trim().max(1000).nullish().transform((v) => v || null);

export const langCode = z.enum(LANG_CODES as [string, ...string[]]);

/** {"en": {"name": "..."}} — unknown languages rejected, blank values dropped. */
export function translationsSchema<F extends string>(fields: Record<F, number>) {
  const shape = Object.fromEntries(Object.entries(fields).map(([f, max]) => [f, z.string().trim().max(max as number).optional()]));
  return z
    .record(z.string(), z.object(shape))
    .refine((t) => Object.keys(t).every(isLangCode), "Unknown language code")
    .transform((t) => {
      const out: Record<string, Partial<Record<F, string>>> = {};
      for (const [lang, values] of Object.entries(t)) {
        const kept = Object.fromEntries(Object.entries(values).filter(([, v]) => v)) as Partial<Record<F, string>>;
        if (Object.keys(kept).length) out[lang] = kept;
      }
      return out;
    });
}

/** Item variants; the item's own price is set to the cheapest one. */
export const itemOptionsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(40),
      price: z.number().int().min(0),
      translations: translationsSchema({ name: 40 }).default({}),
    }),
  )
  .max(12);

export const themeSchema = z.object({
  primary: hex,
  background: hex,
  surface: hex,
  text: hex,
  headerStyle: z.enum(HEADER_STYLES),
  headerColor2: hex,
  headerImageKey: z.string().max(200).nullable(),
  decoration: z.enum(DECORATION_KEYS as [string, ...string[]]),
  font: z.enum(Object.keys(FONTS) as [string, ...string[]]),
  corners: z.enum(Object.keys(CORNERS) as [string, ...string[]]),
  layout: z.enum(LAYOUT_KEYS as [string, ...string[]]).default("rows"),
  banner: z
    .record(z.string(), z.string().trim().max(200))
    .refine((b) => Object.keys(b).every(isLangCode), "Unknown language code")
    .transform((b) => Object.fromEntries(Object.entries(b).filter(([, v]) => v))),
});

export const monthDay = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Use MM-DD");
