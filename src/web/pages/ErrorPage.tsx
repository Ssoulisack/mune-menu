import { useEffect, useState } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { LANG_CODES, UI_STRINGS } from "../../shared/i18n";
import { pickInitialLanguage } from "../lib/language";
import { MenuSkeleton } from "./Menu";

const AUTO_RELOAD_KEY = "mune.auto-reload";

// Decided once per page load (React may run a component's setup twice in development).
let autoReloadDecision: boolean | null = null;

/** True at most once per 30 s, so a crash that survives a reload doesn't reload forever. */
function claimAutoReload() {
  autoReloadDecision ??= checkAutoReload();
  return autoReloadDecision;
}

function checkAutoReload() {
  try {
    const last = Number(sessionStorage.getItem(AUTO_RELOAD_KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(AUTO_RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false; // storage blocked: can't guard against a loop, so don't auto-reload
  }
}

/** What went wrong, as text: for the admin's "Technical details" box. */
function describe(error: unknown) {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return `${error.message}\n\n${error.stack ?? ""}`.trim();
  return String(error);
}

const is404 = (error: unknown) => isRouteErrorResponse(error) && error.status === 404;

/**
 * Shown to customers when the public menu crashes, instead of React Router's developer screen.
 * First it quietly reloads once behind the loading screen (most crashes are one-offs, e.g. right
 * after a deploy); only if the menu crashes again does the visitor see this page.
 * The menu (and its theme) may be what failed, so this page uses neutral colours and only the
 * built-in UI strings, in the visitor's language.
 */
export function MenuErrorPage() {
  const error = useRouteError();
  const ui = UI_STRINGS[pickInitialLanguage(LANG_CODES, "lo")];
  const notFound = is404(error);
  const [autoReload] = useState(() => !notFound && claimAutoReload());

  useEffect(() => {
    console.error(error);
    if (autoReload) location.reload();
  }, [autoReload, error]);

  if (autoReload) return <MenuSkeleton />;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#faf6f1] px-6 py-12 text-center text-[#2b211b]">
      <div className="max-w-sm">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-[#6f4e37]/10 text-[#6f4e37]">
          {/* Coffee cup */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-10" aria-hidden>
            <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
            <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M8 3.5c0 1 1 1.5 1 2.5M11.5 3.5c0 1 1 1.5 1 2.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{notFound ? ui.notFound : ui.errorTitle}</h1>
        {!notFound && <p className="mt-3 text-[#2b211b]/70">{ui.errorBody}</p>}
        <div className="mt-8 flex flex-col items-center gap-3">
          {notFound ? (
            <Link to="/" className="rounded-full bg-[#6f4e37] px-6 py-2.5 font-semibold text-white">
              {ui.backToMenu}
            </Link>
          ) : (
            // A full reload also fetches fresh menu data, which fixes most one-off errors.
            <button type="button" onClick={() => location.reload()} className="rounded-full bg-[#6f4e37] px-6 py-2.5 font-semibold text-white">
              {ui.retry}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Backoffice error. Inside the admin layout (`inLayout`) the header and navigation stay usable;
 * if the layout itself failed it fills the page. Technical details can be copied for support.
 */
export function AdminErrorPage({ inLayout = false }: { inLayout?: boolean }) {
  const error = useRouteError();
  const details = describe(error);
  const [copied, setCopied] = useState(false);
  const notFound = is404(error);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.href}\n${details}`);
      setCopied(true);
    } catch {
      // Clipboard blocked: the details are still selectable in the box.
    }
  };

  return (
    <div className={inLayout ? "" : "min-h-dvh bg-stone-100 px-4 py-12 text-stone-900"}>
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-lg font-bold text-red-700" aria-hidden>
            !
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">{notFound ? "Page not found" : "Something went wrong on this page"}</h1>
            <p className="mt-1 text-sm text-stone-600">
              {notFound
                ? "This backoffice page doesn't exist."
                : "Your saved data is safe. Try reloading; if it happens again, copy the details below and send them to your developer."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!notFound && (
                <button type="button" onClick={() => location.reload()} className="rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-stone-700">
                  Reload page
                </button>
              )}
              <Link to="/admin" className="rounded-lg bg-stone-100 px-3.5 py-2 text-sm font-medium text-stone-800 hover:bg-stone-200">
                Back to items
              </Link>
            </div>
          </div>
        </div>
        {!notFound && (
          <details className="mt-5 rounded-lg bg-stone-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-stone-700">Technical details</summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-stone-600">{details}</pre>
            <button type="button" onClick={copy} className="mt-3 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-100">
              {copied ? "Copied ✓" : "Copy details"}
            </button>
          </details>
        )}
      </div>
    </div>
  );
}
