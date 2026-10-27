import { MenuView } from "../MenuView";
import { usePreview } from "./PreviewContext";
import { PhoneFrame } from "./PhoneFrame";

// Phone-framed live preview of the customer menu, docked on the right (or full-screen on small screens).
export function PreviewPanel() {
  const { open, setOpen, menu, notes, focusCategoryId, lang, setLang } = usePreview();
  if (!open) return null;

  const activeLang = lang && menu?.settings.languages.includes(lang) ? lang : menu?.settings.defaultLanguage;

  return (
    <aside
      aria-label="Live preview"
      className="no-print fixed inset-0 z-30 flex flex-col items-center bg-stone-900/60 p-4 backdrop-blur-sm lg:sticky lg:inset-auto lg:top-[4.25rem] lg:z-0 lg:h-[calc(100dvh-5.25rem)] lg:w-[380px] lg:shrink-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
    >
      <div className="mb-3 flex w-[370px] max-w-full items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-white lg:text-stone-500">Live preview</span>
        {notes.map((note) => (
          <span key={note} className="truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            {note}
          </span>
        ))}
        {!notes.length && menu?.season && (
          <span className="truncate rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">{menu.season.name}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto rounded-md px-2 py-1 text-sm text-white hover:bg-white/10 lg:text-stone-500 lg:hover:bg-stone-200"
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 w-full flex-1">
        <PhoneFrame statusBarColor={menu?.theme.primary ?? "#1c1917"}>
          {menu && activeLang ? (
            <MenuView menu={menu} theme={menu.theme} lang={activeLang} onLangChange={setLang} focusCategoryId={focusCategoryId} contained />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">Loading…</div>
          )}
        </PhoneFrame>
      </div>
    </aside>
  );
}

export function PreviewToggle() {
  const { open, setOpen } = usePreview();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-pressed={open}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ${open ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-300 hover:bg-stone-100"}`}
    >
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="1" y="1" width="10" height="14" rx="2" />
        <path d="M5 12.5h2" strokeLinecap="round" />
      </svg>
      Preview
    </button>
  );
}
