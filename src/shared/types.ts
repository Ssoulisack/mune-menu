// Shapes returned by the API, shared by the worker and the web app.
import type { LangCode, Translations } from "./i18n";
import type { MenuTheme } from "./theme";

export type InfoField = "restaurantName" | "tagline" | "address" | "openingHours";

export interface SettingsDTO {
  restaurantName: string;
  tagline: string | null;
  logoKey: string | null;
  currency: string;
  phone: string | null;
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
    items: Pick<ItemDTO, "id" | "name" | "description" | "price" | "imageKey" | "isAvailable" | "translations">[];
  })[];
}
