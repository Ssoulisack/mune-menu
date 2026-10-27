import { useEffect, useId, useRef, useState } from "react";
import { LANGUAGES, type LangCode } from "../../shared/i18n";
import { InfoIcon } from "./InfoIcon";

/** Globe button showing the current language; opens a list of the menu's languages. */
export function LanguageMenu({ languages, value, onChange, label }: { languages: LangCode[]; value: LangCode; onChange: (lang: LangCode) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Close on a tap outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${LANGUAGES[value].label}`}
        className="flex items-center gap-1.5 rounded-full bg-black/25 py-1.5 pl-2.5 pr-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/35"
      >
        <InfoIcon name="globe" className="size-[18px]" />
        <span>{LANGUAGES[value].label}</span>
        <InfoIcon name="chevron" className={`size-4 opacity-80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 min-w-40 overflow-hidden rounded-2xl bg-white py-1 text-stone-900 shadow-xl ring-1 ring-black/10"
        >
          {languages.map((code) => (
            <li key={code} role="option" aria-selected={code === value}>
              <button
                type="button"
                lang={code}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-stone-100 ${code === value ? "font-semibold" : ""}`}
              >
                {LANGUAGES[code].label}
                {code === value && <InfoIcon name="check" className="text-[var(--m-primary)]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
