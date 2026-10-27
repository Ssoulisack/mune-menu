// The public menu is cached briefly at the edge; admin writes purge it so changes show immediately.
// Bump the version when the menu's shape changes, so a deploy never serves data cached by the old code.
const MENU_CACHE_URL = "https://cache.internal/api/public/menu?v=2";

export const menuCacheKey = () => new Request(MENU_CACHE_URL);

export async function purgeMenuCache() {
  await caches.default.delete(menuCacheKey());
}
