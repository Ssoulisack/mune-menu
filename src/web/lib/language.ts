import { isLangCode, type LangCode } from "../../shared/i18n";

const STORAGE_KEY = "mune.lang";

/** Saved choice → browser language → restaurant default. */
export function pickInitialLanguage(enabled: LangCode[], fallback: LangCode): LangCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLangCode(saved) && enabled.includes(saved)) return saved;
  } catch {
    // storage blocked (private mode) — fall through
  }
  for (const tag of navigator.languages ?? []) {
    const code = tag.toLowerCase().split("-")[0];
    if (isLangCode(code) && enabled.includes(code)) return code;
  }
  return fallback;
}

export function saveLanguage(lang: LangCode) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}
