// Pure helpers that apply unsaved backoffice edits to the preview menu.
import type { CategoryDTO, ItemDTO, PublicMenu, SettingsDTO } from "../../../shared/types";
import type { MenuTheme } from "../../../shared/theme";

type MenuCategory = PublicMenu["categories"][number];

const availableFirst = (items: MenuCategory["items"]) => [...items].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));

/** Insert or replace an item (id null = new item) the way the public menu would show it. */
export function applyItemDraft(
  menu: PublicMenu,
  draft: Omit<ItemDTO, "id" | "sortOrder"> & { id: number | null },
  allCategories: CategoryDTO[],
): PublicMenu {
  const id = draft.id ?? -1;
  let savedCategoryId: number | null = null;
  let savedIndex = -1;

  let categories: MenuCategory[] = menu.categories.map((c) => {
    const index = c.items.findIndex((i) => i.id === id);
    if (index < 0) return c;
    savedCategoryId = c.id;
    savedIndex = index;
    return { ...c, items: c.items.filter((i) => i.id !== id) };
  });

  const category = allCategories.find((c) => c.id === draft.categoryId);
  if (draft.isActive && category?.isActive) {
    // The target category may be missing from the menu because it has no visible items yet.
    if (!categories.some((c) => c.id === category.id)) {
      const order = allCategories.map((c) => c.id);
      const at = categories.findIndex((c) => order.indexOf(c.id) > order.indexOf(category.id));
      const fresh: MenuCategory = { id: category.id, name: category.name, translations: category.translations, items: [] };
      categories = at < 0 ? [...categories, fresh] : [...categories.slice(0, at), fresh, ...categories.slice(at)];
    }
    const item = {
      id,
      name: draft.name || "…",
      description: draft.description,
      price: draft.price,
      imageKey: draft.imageKey,
      isAvailable: draft.isAvailable,
      translations: draft.translations,
      options: draft.options,
    };
    categories = categories.map((c) => {
      if (c.id !== draft.categoryId) return c;
      const items = [...c.items];
      items.splice(savedCategoryId === c.id ? savedIndex : items.length, 0, item);
      return { ...c, items: availableFirst(items) };
    });
  }

  return { ...menu, categories: categories.filter((c) => c.items.length > 0) };
}

export function applyCategoryDraft(menu: PublicMenu, draft: Pick<CategoryDTO, "id" | "name" | "translations">): PublicMenu {
  return {
    ...menu,
    categories: menu.categories.map((c) => (c.id === draft.id ? { ...c, name: draft.name || c.name, translations: draft.translations } : c)),
  };
}

export function applySettingsDraft(menu: PublicMenu, settings: SettingsDTO): PublicMenu {
  return { ...menu, settings: { ...settings, restaurantName: settings.restaurantName || menu.settings.restaurantName } };
}

export function applyThemeDraft(menu: PublicMenu, theme: MenuTheme): PublicMenu {
  return { ...menu, theme };
}

/** Cheap structural equality for form "dirty" checks. */
export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
