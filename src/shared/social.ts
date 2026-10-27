// Social links in the restaurant settings. Owners may type a full link or just the page name /
// @handle; these turn what they typed into the link that's stored and shown on the menu.

const withHttps = (value: string) => (/^https?:\/\//i.test(value) ? value.replace(/^http:/i, "https:") : `https://${value}`);

function parseUrl(value: string) {
  try {
    return new URL(withHttps(value));
  } catch {
    return null;
  }
}

const isHost = (url: URL, domains: string[]) => domains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));

/** "mune.cafe", "facebook.com/mune.cafe" or a full link → https://www.facebook.com/… (null if not Facebook). */
export function normalizeFacebook(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[\w.-]+$/.test(value) && !/\.(com|me)$/i.test(value)) return `https://www.facebook.com/${value}`;
  const url = parseUrl(value);
  return url && isHost(url, ["facebook.com", "fb.com", "fb.me"]) ? url.toString() : null;
}

/** "@mune.cafe", "mune.cafe" or a full link → https://www.tiktok.com/@… (null if not TikTok). */
export function normalizeTiktok(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const handle = /^@?([\w.]+)$/.exec(value);
  if (handle && !/\.com$/i.test(value)) return `https://www.tiktok.com/@${handle[1]}`;
  const url = parseUrl(value);
  return url && isHost(url, ["tiktok.com"]) ? url.toString() : null;
}

/** Digits of a phone number in international format (8–15 digits), or null. */
export function whatsappDigits(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return /^[\d\s()+.-]+$/.test(input.trim()) && digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Opens a WhatsApp chat with the number. */
export const whatsappLink = (number: string) => `https://wa.me/${whatsappDigits(number) ?? ""}`;
