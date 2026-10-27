import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PublicMenu } from "../../../shared/types";
import type { LangCode } from "../../../shared/i18n";
import { api, DATA_CHANGED_EVENT } from "../../lib/api";

/** Turns the saved menu into what it would look like with a page's unsaved edits applied. */
export type PreviewDraft = (menu: PublicMenu) => PublicMenu;

interface DraftEntry {
  apply: PreviewDraft;
  /** Shown above the phone, e.g. "unsaved changes" or "previewing Christmas". */
  note: string;
}

interface PreviewState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Saved menu with every active draft applied. */
  menu: PublicMenu | null;
  notes: string[];
  setDraft: (key: string, draft: PreviewDraft | null, note?: string) => void;
  focusCategoryId: number | null;
  setFocusCategoryId: (id: number | null) => void;
  lang: LangCode | null;
  setLang: (lang: LangCode) => void;
}

const PreviewContext = createContext<PreviewState | null>(null);
const STORAGE_KEY = "mune.preview-open";

function initialOpen() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "1";
  } catch {
    // storage blocked
  }
  return window.matchMedia("(min-width: 1280px)").matches;
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(initialOpen);
  const [saved, setSaved] = useState<PublicMenu | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [focusCategoryId, setFocusCategoryId] = useState<number | null>(null);
  const [lang, setLang] = useState<LangCode | null>(null);
  const reloadTimer = useRef<number>(undefined);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(() => {
    api.get<PublicMenu>("/api/admin/preview-menu").then(setSaved).catch(() => undefined);
  }, []);

  // Fetch while the panel is open, and refetch after every save (debounced: a reorder may fire several).
  useEffect(() => {
    if (!open) return;
    load();
    const onChange = () => {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = window.setTimeout(load, 150);
    };
    window.addEventListener(DATA_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onChange);
      clearTimeout(reloadTimer.current);
    };
  }, [open, load]);

  const setDraft = useCallback((key: string, draft: PreviewDraft | null, note = "unsaved changes") => {
    setDrafts((prev) => {
      if (!draft) {
        if (!(key in prev)) return prev;
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { apply: draft, note } };
    });
  }, []);

  const menu = useMemo(() => {
    if (!saved) return null;
    return Object.values(drafts).reduce((m, d) => d.apply(m), saved);
  }, [saved, drafts]);

  const value = useMemo<PreviewState>(
    () => ({ open, setOpen, menu, notes: [...new Set(Object.values(drafts).map((d) => d.note))], setDraft, focusCategoryId, setFocusCategoryId, lang, setLang }),
    [open, setOpen, menu, drafts, setDraft, focusCategoryId, lang],
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used inside <PreviewProvider>");
  return ctx;
}

/** Show a page's unsaved edits in the preview; removed automatically when the page unmounts. Memoize `draft`. */
export function usePreviewDraft(key: string, draft: PreviewDraft | null, note?: string) {
  const { setDraft } = usePreview();
  useEffect(() => {
    setDraft(key, draft, note);
    return () => setDraft(key, null);
  }, [key, draft, note, setDraft]);
}

/** Make the preview open on a given category while this page shows it. */
export function usePreviewFocus(categoryId: number | null | undefined) {
  const { setFocusCategoryId } = usePreview();
  useEffect(() => {
    setFocusCategoryId(categoryId ?? null);
  }, [categoryId, setFocusCategoryId]);
  useEffect(() => () => setFocusCategoryId(null), [setFocusCategoryId]);
}
