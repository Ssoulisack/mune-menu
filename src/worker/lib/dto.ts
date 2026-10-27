import { categories, items, seasons, settings } from "../db/schema";
import type { SettingsDTO } from "../../shared/types";

// Column selections matching the DTOs in src/shared/types.ts.
export const settingsColumns = {
  restaurantName: settings.restaurantName,
  tagline: settings.tagline,
  logoKey: settings.logoKey,
  currency: settings.currency,
  whatsapp: settings.whatsapp,
  facebookUrl: settings.facebookUrl,
  tiktokUrl: settings.tiktokUrl,
  address: settings.address,
  openingHours: settings.openingHours,
  defaultLanguage: settings.defaultLanguage,
  languages: settings.languages,
  timezone: settings.timezone,
  translations: settings.translations,
};

export const categoryColumns = {
  id: categories.id,
  name: categories.name,
  sortOrder: categories.sortOrder,
  isActive: categories.isActive,
  translations: categories.translations,
};

export const itemColumns = {
  id: items.id,
  categoryId: items.categoryId,
  name: items.name,
  description: items.description,
  price: items.price,
  imageKey: items.imageKey,
  isAvailable: items.isAvailable,
  isActive: items.isActive,
  sortOrder: items.sortOrder,
  translations: items.translations,
  options: items.options,
};

export const seasonColumns = {
  id: seasons.id,
  name: seasons.name,
  startDate: seasons.startDate,
  endDate: seasons.endDate,
  isActive: seasons.isActive,
  theme: seasons.theme,
};

export const DEFAULT_SETTINGS: SettingsDTO = {
  restaurantName: "My Café",
  tagline: null,
  logoKey: null,
  currency: "LAK",
  whatsapp: null,
  facebookUrl: null,
  tiktokUrl: null,
  address: null,
  openingHours: null,
  defaultLanguage: "lo",
  languages: ["lo", "en"],
  timezone: "Asia/Vientiane",
  translations: {},
};
