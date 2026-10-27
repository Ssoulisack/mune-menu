// Visual theme of the public menu. The owner picks a preset and customises it,
// either as the default theme or for a season (date range) that switches on automatically.

export const DECORATIONS = {
  none: { label: "None", symbols: [] },
  snow: { label: "Snow", symbols: ["❄️", "❅", "❆"] },
  petals: { label: "Flower petals", symbols: ["🌸", "🌼"] },
  splash: { label: "Water splash", symbols: ["💦", "💧", "🌼"] },
  leaves: { label: "Falling leaves", symbols: ["🍂", "🍁"] },
  rain: { label: "Rain", symbols: ["💧"] },
  hearts: { label: "Hearts", symbols: ["💕", "❤️"] },
  stars: { label: "Sparkles", symbols: ["✨", "⭐"] },
  lotus: { label: "Lotus & candles", symbols: ["🪷", "🕯️", "✨"] },
  lanterns: { label: "Lanterns", symbols: ["🏮", "🧧"] },
  spooky: { label: "Halloween", symbols: ["🎃", "🦇", "👻"] },
} as const;

export type DecorationKey = keyof typeof DECORATIONS;
export const DECORATION_KEYS = Object.keys(DECORATIONS) as DecorationKey[];

export const FONTS = {
  sans: { label: "Modern", stack: '"Noto Sans Lao", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
  serif: { label: "Elegant", stack: '"Playfair Display", "Noto Serif Lao", Georgia, serif' },
  rounded: { label: "Friendly", stack: '"Nunito", "Noto Sans Lao", ui-rounded, system-ui, sans-serif' },
} as const;
export type FontKey = keyof typeof FONTS;

export const CORNERS = { square: { label: "Square", px: 4 }, rounded: { label: "Rounded", px: 16 }, round: { label: "Extra round", px: 26 } } as const;
export type CornerKey = keyof typeof CORNERS;

export const HEADER_STYLES = ["solid", "gradient", "image"] as const;

// How items are laid out. Customers can switch on the menu; this is the starting choice.
export const LAYOUTS = {
  rows: { label: "Rows", hint: "Text with a small photo on the side" },
  grid: { label: "Grid", hint: "Photo tiles, 2 per row on phones" },
  column: { label: "Column", hint: "One big photo card per item" },
} as const;
export type LayoutKey = keyof typeof LAYOUTS;
export const LAYOUT_KEYS = Object.keys(LAYOUTS) as LayoutKey[];

export interface MenuTheme {
  primary: string; // header, active tab, prices
  background: string;
  surface: string; // item cards
  text: string;
  headerStyle: (typeof HEADER_STYLES)[number];
  headerColor2: string; // end colour of the gradient header
  headerImageKey: string | null;
  decoration: DecorationKey;
  font: FontKey;
  corners: CornerKey;
  layout: LayoutKey;
  banner: Record<string, string>; // short message per language, e.g. "Happy Pi Mai!"
}

export const DEFAULT_THEME: MenuTheme = {
  primary: "#6f4e37",
  background: "#faf6f1",
  surface: "#ffffff",
  text: "#2b211b",
  headerStyle: "gradient",
  headerColor2: "#a47551",
  headerImageKey: null,
  decoration: "none",
  font: "sans",
  corners: "rounded",
  layout: "rows",
  banner: {},
};

export const THEME_PRESETS: { id: string; name: string; emoji: string; theme: MenuTheme }[] = [
  { id: "classic", name: "Classic café", emoji: "☕", theme: DEFAULT_THEME },
  {
    id: "pimai",
    name: "Pi Mai Lao (New Year)",
    emoji: "💦",
    theme: { ...DEFAULT_THEME, primary: "#0e7490", headerColor2: "#f59e0b", background: "#f0fbff", text: "#0c2a33", decoration: "splash", font: "rounded",
      banner: { lo: "ສະບາຍດີປີໃໝ່ລາວ! 💦", en: "Happy Lao New Year! 💦", zh: "老挝新年快乐！💦" } },
  },
  {
    id: "summer",
    name: "Summer",
    emoji: "☀️",
    theme: { ...DEFAULT_THEME, primary: "#ea580c", headerColor2: "#facc15", background: "#fffbeb", text: "#3b1d06", decoration: "none", font: "rounded" },
  },
  {
    id: "rainy",
    name: "Rainy season",
    emoji: "🌧️",
    theme: { ...DEFAULT_THEME, primary: "#166534", headerColor2: "#0f766e", background: "#f0f7f2", text: "#11261a", decoration: "rain" },
  },
  {
    id: "thatluang",
    name: "That Luang Festival",
    emoji: "🪷",
    theme: { ...DEFAULT_THEME, primary: "#a16207", headerColor2: "#eab308", background: "#fffaeb", text: "#3a2a05", decoration: "lotus", font: "serif",
      banner: { lo: "ບຸນທາດຫຼວງ 🪷", en: "That Luang Festival 🪷", zh: "塔銮节 🪷" } },
  },
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    theme: { ...DEFAULT_THEME, primary: "#ea580c", headerColor2: "#7c2d12", background: "#1c1917", surface: "#292524", text: "#fafaf9", decoration: "spooky",
      banner: { lo: "ສຸກສັນວັນຮາໂລວີນ 🎃", en: "Happy Halloween 🎃", zh: "万圣节快乐 🎃" } },
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    theme: { ...DEFAULT_THEME, primary: "#b91c1c", headerColor2: "#166534", background: "#fdf8f6", text: "#2a1414", decoration: "snow", font: "serif",
      banner: { lo: "ສຸກສັນວັນຄຣິສມາດ 🎄", en: "Merry Christmas 🎄", zh: "圣诞快乐 🎄" } },
  },
  {
    id: "cny",
    name: "Chinese New Year",
    emoji: "🏮",
    theme: { ...DEFAULT_THEME, primary: "#b91c1c", headerColor2: "#d97706", background: "#fff7ed", text: "#3b0a0a", decoration: "lanterns",
      banner: { lo: "ສຸກສັນວັນກຸດຈີນ 🧧", en: "Happy Lunar New Year 🧧", zh: "新春快乐 🧧" } },
  },
  {
    id: "valentine",
    name: "Valentine's",
    emoji: "💕",
    theme: { ...DEFAULT_THEME, primary: "#be185d", headerColor2: "#f472b6", background: "#fff1f5", text: "#3f0d24", decoration: "hearts", font: "serif" },
  },
  {
    id: "night",
    name: "Night",
    emoji: "🌙",
    theme: { ...DEFAULT_THEME, primary: "#c08457", headerColor2: "#3f2a1d", background: "#171311", surface: "#231d19", text: "#f5ece4", decoration: "stars" },
  },
];

/** "MM-DD" range check that also handles ranges crossing new year (e.g. 12-20 → 01-05). */
export function isInSeason(today: string, start: string, end: string) {
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
}
