// The public menu is cached briefly at the edge; admin writes purge it so changes show immediately.
const MENU_CACHE_URL = "https://cache.internal/api/public/menu";

export const menuCacheKey = () => new Request(MENU_CACHE_URL);

export async function purgeMenuCache() {
  await caches.default.delete(menuCacheKey());
}
