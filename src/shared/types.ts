// Shapes returned by the API, shared by the worker and the web app.
import type { LangCode, Translations } from "./i18n";
import type { MenuTheme } from "./theme";

export type InfoField = "restaurantName" | "tagline" | "address" | "openingHours";

export interface SettingsDTO {
  restaurantName: string;
  tagline: string | null;
  logoKey: string | null;
  currency: string;
  /** WhatsApp number in international format, e.g. "+856 20 5555 0100". */
  whatsapp: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  address: string | null;
  openingHours: string | null;
  defaultLanguage: LangCode;
  languages: LangCode[];
  timezone: string;
  translations: Translations<InfoField>;
}

export interface CategoryDTO {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  translations: Translations<"name">;
}

/** A variant with its own price, e.g. Hot ₭38,000 / Iced ₭42,000. */
export interface ItemOption {
  name: string;
  price: number;
  translations: Translations<"name">;
}

export interface ItemDTO {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  imageKey: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  translations: Translations<"name" | "description">;
  /** When present, the menu lists these prices instead of `price` (which then holds the lowest). */
  options: ItemOption[];
}

export interface SeasonDTO {
  id: number;
  name: string;
  startDate: string; // "MM-DD"
  endDate: string; // "MM-DD"
  isActive: boolean;
  theme: MenuTheme;
}

export interface PublicMenu {
  settings: SettingsDTO;
  theme: MenuTheme;
  season: { id: number; name: string } | null;
  categories: (Pick<CategoryDTO, "id" | "name" | "translations"> & {
    items: Pick<ItemDTO, "id" | "name" | "description" | "price" | "imageKey" | "isAvailable" | "translations" | "options">[];
  })[];
}

/** A stored photo and what uses it (backoffice Media page). */
export interface MediaDTO {
  key: string;
  size: number | null;
  uploadedAt: string | null;
  /** Labels like "Item: Café Latte", "Logo", "Season: Halloween (header photo)"; empty = unused. */
  usedBy: string[];
}
