import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PublicMenu } from "../../shared/types";
import { LANGUAGES, translate, UI_STRINGS, type LangCode } from "../../shared/i18n";
import { CORNERS, FONTS, type MenuTheme } from "../../shared/theme";
import { imageUrl } from "../lib/api";
import { formatPrice } from "../lib/money";
import { Decorations } from "./Decorations";
import AnimatedList from "./AnimatedList/AnimatedList";
import ClickSpark from "./ClickSpark";
import { useEdgePager, type PageDirection } from "../lib/useEdgePager";

type MenuItem = PublicMenu["categories"][number]["items"][number];

interface Props {
  menu: PublicMenu;
  theme: MenuTheme;
  lang: LangCode;
  onLangChange: (lang: LangCode) => void;
  /** Render inside a fixed-size box (admin theme preview) instead of the whole page. */
  contained?: boolean;
  /** Switch to this category when it changes (admin preview follows the page being edited). */
  focusCategoryId?: number | null;
}

export function MenuView({ menu, theme, lang, onLangChange, contained = false, focusCategoryId = null }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Direction of the last category change, for the slide-in animation.
  const [enterDir, setEnterDir] = useState<PageDirection | null>(null);
  const landAtBottom = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const { settings } = menu;
  const ui = UI_STRINGS[lang];
  const locale = LANGUAGES[lang].locale;
  const info = (field: "restaurantName" | "tagline" | "address" | "openingHours") => translate(settings[field], settings.translations, lang, field);
  const catName = (c: PublicMenu["categories"][number]) => translate(c.name, c.translations, lang, "name")!;

  const searching = query.trim().length > 0;
  const activeId = menu.categories.some((c) => c.id === selectedId) ? selectedId : (menu.categories[0]?.id ?? null);

  // One category at a time; while searching, show matches from every category (in any language).
  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menu.categories.filter((c) => c.id === activeId);
    const matches = (i: MenuItem) =>
      [i.name, i.description, ...Object.values(i.translations).flatMap((t) => [t?.name, t?.description])].some((s) => s?.toLowerCase().includes(q));
    return menu.categories.map((c) => ({ ...c, items: c.items.filter(matches) })).filter((c) => c.items.length > 0);
  }, [menu, query, activeId]);

  useEffect(() => {
    if (focusCategoryId == null) return;
    setSelectedId(focusCategoryId);
    setEnterDir(null);
    setQuery("");
  }, [focusCategoryId]);

  const activeIndex = menu.categories.findIndex((c) => c.id === activeId);
  const prevCategory = activeIndex > 0 ? menu.categories[activeIndex - 1] : null;
  const nextCategory = activeIndex >= 0 ? (menu.categories[activeIndex + 1] ?? null) : null;

  // Keep scrolling past the end → next category; scroll back up past the top → the previous one.
  const pull = useEdgePager({
    scrollerRef: contained ? rootRef : null,
    enabled: !searching && menu.categories.length > 1,
    canNext: nextCategory !== null,
    canPrev: prevCategory !== null,
    onPage: (dir) => {
      const target = dir === "next" ? nextCategory : prevCategory;
      if (target) selectCategory(target.id, dir);
    },
  });

  // Going back lands at the bottom of the previous category, where the visitor left it.
  useLayoutEffect(() => {
    if (!landAtBottom.current) return;
    landAtBottom.current = false;
    const scroller = contained ? rootRef.current : null;
    const total = scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;
    (scroller ?? window).scrollTo({ top: total });
  }, [activeId, contained]);

  // Keep the active tab visible in the horizontal tab strip.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${activeId}"]`);
    const strip = tabsRef.current;
    if (tab && strip) strip.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [activeId]);

  function selectCategory(id: number, dir?: PageDirection) {
    const from = menu.categories.findIndex((c) => c.id === activeId);
    const to = menu.categories.findIndex((c) => c.id === id);
    setEnterDir(dir ?? (to > from ? "next" : to < from ? "prev" : null));
    setSelectedId(id);
    setQuery("");
    if (dir === "prev") {
      landAtBottom.current = true;
      return;
    }
    // If the visitor had scrolled down, jump back to the top of the list.
    const nav = navRef.current;
    if (!nav) return;
    const scroller = contained ? rootRef.current : null;
    const scrolled = scroller ? scroller.scrollTop : window.scrollY;
    if (scrolled > nav.offsetTop) (scroller ?? window).scrollTo({ top: nav.offsetTop });
  }

  const style = {
    "--m-primary": theme.primary,
    "--m-bg": theme.background,
    "--m-surface": theme.surface,
    "--m-text": theme.text,
    "--m-font": FONTS[theme.font].stack,
    "--m-radius": `${CORNERS[theme.corners].px}px`,
  } as CSSProperties;

  const headerBackground =
    theme.headerStyle === "image" && theme.headerImageKey
      ? `linear-gradient(to bottom, rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6)), url(${imageUrl(theme.headerImageKey)}) center / cover`
      : theme.headerStyle === "solid"
        ? theme.primary
        : `linear-gradient(135deg, ${theme.primary}, ${theme.headerColor2})`;

  const banner = theme.banner[lang] || theme.banner[settings.defaultLanguage];
  const dark = isDark(theme.background);

  // Paint the animated list's rows with the menu theme instead of its built-in dark/light palette.
  const listColors = {
    "--al-tile": "var(--m-surface)",
    "--al-ink": "var(--m-text)",
    "--al-muted": "color-mix(in srgb, var(--m-text) 62%, transparent)",
    "--al-tile-edge": "color-mix(in srgb, var(--m-text) 10%, transparent)",
    "--al-well": "color-mix(in srgb, var(--m-text) 6%, transparent)",
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      lang={lang}
      style={style}
      className={`m-root relative ${dark ? "m-dark" : ""} ${contained ? "h-full overflow-y-auto" : "min-h-dvh"}`}
    >
      <Decorations kind={theme.decoration} contained={contained} />

      {pull?.dir === "prev" && prevCategory && (
        <div
          aria-hidden
          className="m-surface pointer-events-none absolute left-1/2 top-3 z-50 flex items-center gap-2 rounded-full! px-3 py-1.5 text-sm font-semibold shadow-lg"
          style={{ transform: `translate(-50%, ${pull.progress * 14}px)`, opacity: 0.4 + pull.progress * 0.6 }}
        >
          <PullRing progress={pull.progress} small />
          ↑ {ui.prev}: {catName(prevCategory)}
        </div>
      )}

      {/* Tap/click sparks in the theme colours; above the sticky bar so taps on tabs sparkle too. */}
      <ClickSpark
        sparkColor={[theme.primary, theme.headerColor2, "#ffffff"]}
        shape="star"
        sparkCount={10}
        sparkSize={18}
        sparkRadius={60}
        duration={850}
        zIndex={40}
        // Full content height (not 100%), otherwise the sticky nav stops sticking in the preview.
        style={{ height: "auto", minHeight: "100%" }}
      >
        <header className="relative px-5 pb-6 pt-8 text-white" style={{ background: headerBackground }}>
          {settings.languages.length > 1 && (
            <div className="mx-auto mb-4 flex max-w-2xl justify-end">
              <div className="flex gap-1 rounded-full bg-black/20 p-1 backdrop-blur-sm">
                {settings.languages.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onLangChange(code)}
                    aria-pressed={code === lang}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${code === lang ? "bg-white text-stone-900" : "text-white/90 hover:bg-white/15"}`}
                  >
                    {LANGUAGES[code].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            {settings.logoKey && <img src={imageUrl(settings.logoKey)} alt="" className="size-16 shrink-0 rounded-2xl bg-white object-cover shadow" />}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{info("restaurantName")}</h1>
              {info("tagline") && <p className="mt-1 text-white/85">{info("tagline")}</p>}
            </div>
          </div>
          {(info("openingHours") || info("address") || settings.phone) && (
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
              {info("openingHours") && <span>🕒 {info("openingHours")}</span>}
              {info("address") && <span>📍 {info("address")}</span>}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="underline-offset-2 hover:underline">
                  📞 {settings.phone}
                </a>
              )}
            </div>
          )}
        </header>

        {banner && (
          <div className="px-5 py-2.5 text-center text-sm font-semibold text-white" style={{ background: theme.headerColor2 }}>
            {banner}
          </div>
        )}

        <nav ref={navRef} className="m-nav sticky top-0 z-10 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 pt-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.search}
              className="m-input w-full rounded-full px-4 py-2 text-base outline-none"
            />
          </div>
          <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3">
            {menu.categories.map((c) => {
              const active = !searching && activeId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-cat={c.id}
                  onClick={() => selectCategory(c.id)}
                  aria-pressed={active}
                  className="m-chip shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                >
                  {catName(c)}
                  <span className="ml-1.5 text-xs opacity-60">{c.items.length}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="relative mx-auto max-w-2xl px-4 pb-16">
          {visibleCategories.length === 0 && (
            <p className="m-muted py-16 text-center">{searching ? ui.noMatch.replace("{q}", query) : ui.empty}</p>
          )}
          {visibleCategories.map((c) => (
            <section key={c.id} className={`pt-6 ${!searching && enterDir ? `m-enter-${enterDir}` : ""}`}>
              <h2 className="mb-3 text-xl font-bold">{catName(c)}</h2>
              <AnimatedList
                items={c.items}
                animation="none"
                frame={false}
                showGradients={false}
                displayScrollbar={false}
                maxHeight="none"
                width="100%"
                gap={10}
                radius={CORNERS[theme.corners].px}
                theme={dark ? "dark" : "light"}
                accentColor={theme.primary}
                className="-mx-1.5 w-auto!"
                style={listColors}
                renderItem={(item) => (
                  <div className={`flex w-full gap-4 py-1.5 pl-1.5 ${item.isAvailable ? "" : "opacity-50"}`}>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{translate(item.name, item.translations, lang, "name")}</h3>
                      {translate(item.description, item.translations, lang, "description") && (
                        <p className="m-muted mt-0.5 text-sm">{translate(item.description, item.translations, lang, "description")}</p>
                      )}
                      <p className="mt-2 font-semibold">
                        <span className={item.isAvailable ? "m-price" : ""}>{formatPrice(item.price, settings.currency, locale)}</span>
                        {!item.isAvailable && <span className="m-chip ml-2 rounded-full px-2 py-0.5 text-xs font-medium">{ui.soldOut}</span>}
                      </p>
                    </div>
                    {item.imageKey && (
                      <img
                        src={imageUrl(item.imageKey)}
                        alt={translate(item.name, item.translations, lang, "name") ?? ""}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="m-img size-24 shrink-0 object-cover"
                      />
                    )}
                  </div>
                )}
              />
            </section>
          ))}

          {!searching &&
            menu.categories.length > 1 &&
            (nextCategory ? (
              <button
                type="button"
                onClick={() => selectCategory(nextCategory.id, "next")}
                className="m-surface mt-8 flex w-full items-center gap-3 p-4 text-left"
              >
                <PullRing progress={pull?.dir === "next" ? pull.progress : 0} />
                <span className="min-w-0 flex-1">
                  <span className="m-muted block text-xs">
                    {ui.next} · {ui.keepScrolling}
                  </span>
                  <span className="block truncate font-semibold">{catName(nextCategory)}</span>
                </span>
                <span aria-hidden className="m-price text-lg" style={{ transform: `translateY(${(pull?.dir === "next" ? pull.progress : 0) * 6}px)` }}>
                  ↓
                </span>
              </button>
            ) : (
              <p className="m-muted mt-10 text-center text-sm">— {ui.endOfMenu} —</p>
            ))}
        </main>
      </ClickSpark>
    </div>
  );
}

/** Circle that fills while the visitor pulls past the edge. */
function PullRing({ progress, small = false }: { progress: number; small?: boolean }) {
  const size = small ? 18 : 30;
  const r = size / 2 - 2.5;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={small ? 2.5 : 3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--m-primary)"
        strokeWidth={small ? 2.5 : 3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
      />
    </svg>
  );
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}
