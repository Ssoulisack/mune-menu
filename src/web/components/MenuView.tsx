import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PublicMenu } from "../../shared/types";
import { LANGUAGES, translate, UI_STRINGS, type LangCode } from "../../shared/i18n";
import { CORNERS, FONTS, LAYOUT_KEYS, LAYOUTS, type LayoutKey, type MenuTheme } from "../../shared/theme";
import { imageUrl } from "../lib/api";
import { formatPrice } from "../lib/money";
import { Decorations } from "./Decorations";
import AnimatedList from "./AnimatedList/AnimatedList";
import ClickSpark from "./ClickSpark";
import { InfoIcon } from "./InfoIcon";
import { LanguageMenu } from "./LanguageMenu";
import { LayoutIcon } from "./LayoutIcon";
import MagicRings from "./MagicRings/MagicRings";
import { useEdgePager, type PageDirection } from "../lib/useEdgePager";

type MenuItem = PublicMenu["categories"][number]["items"][number];

const LAYOUT_STORAGE_KEY = "mune.layout";
/** The "All" tab: every category on one page. */
const ALL = "all";

function readStoredLayout(): LayoutKey | null {
  try {
    const value = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return value && value in LAYOUTS ? (value as LayoutKey) : null;
  } catch {
    return null;
  }
}

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
  const [selectedId, setSelectedId] = useState<number | typeof ALL | null>(null);
  // Direction of the last category change, for the slide-in animation.
  const [enterDir, setEnterDir] = useState<PageDirection | null>(null);
  const landAtBottom = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // The theme sets the starting layout; a customer's own pick is remembered on their phone.
  // The admin preview (contained) always starts from the theme so the owner sees their setting.
  const [pickedLayout, setPickedLayout] = useState<LayoutKey | null>(() => (contained ? null : readStoredLayout()));
  const layout: LayoutKey = pickedLayout ?? theme.layout ?? "rows";
  useEffect(() => {
    if (contained) setPickedLayout(null);
  }, [contained, theme.layout]);

  function pickLayout(next: LayoutKey) {
    setPickedLayout(next);
    if (contained) return;
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice just won't be remembered.
    }
  }

  const { settings } = menu;
  const ui = UI_STRINGS[lang];
  const locale = LANGUAGES[lang].locale;
  const info = (field: "restaurantName" | "tagline" | "address" | "openingHours") => translate(settings[field], settings.translations, lang, field);
  const catName = (c: PublicMenu["categories"][number]) => translate(c.name, c.translations, lang, "name")!;

  const searching = query.trim().length > 0;
  const showAll = selectedId === ALL;
  const activeId = showAll || menu.categories.some((c) => c.id === selectedId) ? selectedId : (menu.categories[0]?.id ?? null);
  const totalItems = menu.categories.reduce((sum, c) => sum + c.items.length, 0);

  // One category at a time (or all of them on the "All" tab); while searching, show matches from
  // every category (in any language).
  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeId === ALL ? menu.categories : menu.categories.filter((c) => c.id === activeId);
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
  // (The "All" page has no neighbours: activeIndex is -1 there.)
  const pull = useEdgePager({
    scrollerRef: contained ? rootRef : null,
    enabled: !searching && !showAll && menu.categories.length > 1,
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

  // "All" counts as the page before the first category, for the turn direction.
  function selectCategory(id: number | typeof ALL, dir?: PageDirection) {
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

  // One category's items; `enterClass` plays the page-turn animation when the category changes.
  function renderCategory(c: PublicMenu["categories"][number], enterClass: string) {
    return (
      <section key={c.id} className={`relative pt-6 ${enterClass}`}>
              <h2 className="mb-3 text-xl font-bold">{catName(c)}</h2>
              <AnimatedList
                key={layout} // remount so the selection ring re-measures the new item boxes
                items={c.items}
                animation="none"
                frame={false}
                showGradients={false}
                displayScrollbar={false}
                maxHeight="none"
                width="100%"
                gap={layout === "rows" ? 10 : 12}
                radius={CORNERS[theme.corners].px}
                theme={dark ? "dark" : "light"}
                accentColor={theme.primary}
                // Grid: 2 tiles per row on phones, 3 when the menu is wider (container query, so the
                // admin's phone preview matches a real phone).
                className={`-mx-1.5 w-auto! ${layout === "grid" ? "[--al-columns:2] @lg:[--al-columns:3]" : ""}`}
                itemClassName={layout === "rows" ? "" : "items-stretch! p-2!"}
                style={listColors}
                renderItem={(item) => <ItemCard item={item} layout={layout} lang={lang} locale={locale} currency={settings.currency} soldOutLabel={ui.soldOut} />}
              />
      </section>
    );
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
        {/* z-20: the language dropdown opens over the sticky nav. Top padding clears the phone's status bar
            (the page draws under it with viewport-fit=cover), where taps would be taken by the browser. */}
        <header
          className={`relative isolate z-20 px-5 pb-6 text-white [container-type:inline-size] ${contained ? "pt-8" : "pt-[calc(env(safe-area-inset-top)+2rem)]"}`}
          // The brand colours (name gradient, tagline, info chips) are set on the header so all of it shares them.
          style={{ background: headerBackground, ...brandColors(theme) }}
        >
          {/* Glowing rings behind the brand, tinted from white to a light version of the theme's second header colour. */}
          <MagicRings
            className="pointer-events-none absolute! inset-0 -z-10"
            color="#ffffff"
            colorTwo={mixHex(theme.headerColor2, "#ffffff", 0.5)}
            motion="pulse"
            ringCount={6}
            speed={0.8}
            lineThickness={2}
            glow={1}
            opacity={0.8}
            hoverScale={1.1}
            clickBurst
          />
          {settings.languages.length > 1 && (
            <div className="mx-auto mb-4 flex max-w-2xl justify-end">
              <LanguageMenu languages={settings.languages} value={lang} onChange={onLangChange} label={ui.language} />
            </div>
          )}
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            {settings.logoKey && <img src={imageUrl(settings.logoKey)} alt="" className="size-16 shrink-0 rounded-2xl bg-white object-cover shadow" />}
            <div className="min-w-0">
              <h1 className="m-brand">
                {info("restaurantName")}
              </h1>
              {info("tagline") && <p className="m-tagline mt-3">{info("tagline")}</p>}
            </div>
          </div>
          {(info("openingHours") || info("address") || settings.phone) && (
            <div className="mx-auto mt-5 flex max-w-2xl flex-wrap gap-2 text-sm">
              {info("openingHours") && (
                <span className="m-info-chip">
                  <span className="m-info-icon">
                    <InfoIcon name="clock" className="size-3.5" />
                  </span>
                  {info("openingHours")}
                </span>
              )}
              {info("address") && (
                <span className="m-info-chip">
                  <span className="m-info-icon">
                    <InfoIcon name="pin" className="size-3.5" />
                  </span>
                  {info("address")}
                </span>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="m-info-chip m-info-chip--link">
                  <span className="m-info-icon">
                    <InfoIcon name="phone" className="size-3.5" />
                  </span>
                  {settings.phone}
                </a>
              )}
            </div>
          )}
        </header>

        {banner && (
          <div
            className="m-banner"
            style={{ "--m-banner-a": theme.headerColor2, "--m-banner-b": theme.primary, ...brandColors(theme) } as CSSProperties}
          >
            <span aria-hidden className="m-banner__spark">
              ✦
            </span>
            <span className="m-banner__text">{banner}</span>
            <span aria-hidden className="m-banner__spark m-banner__spark--late">
              ✦
            </span>
          </div>
        )}

        <nav ref={navRef} className={`m-nav sticky top-0 z-10 backdrop-blur ${contained ? "" : "pt-[env(safe-area-inset-top)]"}`}>
          <div className="mx-auto flex max-w-2xl gap-2 px-4 pt-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.search}
              className="m-input min-w-0 flex-1 rounded-full px-4 py-2 text-base outline-none"
            />
            <div role="group" aria-label={ui.layout} className="m-input flex shrink-0 items-center gap-0.5 rounded-full p-1">
              {LAYOUT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickLayout(k)}
                  aria-pressed={layout === k}
                  aria-label={ui[k]}
                  title={ui[k]}
                  className={`grid size-8 place-items-center rounded-full transition-colors ${layout === k ? "bg-[var(--m-primary)] text-white" : "opacity-60"}`}
                >
                  <LayoutIcon layout={k} />
                </button>
              ))}
            </div>
          </div>
          <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3">
            {menu.categories.length > 1 && (
              <button
                type="button"
                data-cat={ALL}
                onClick={() => selectCategory(ALL)}
                aria-pressed={!searching && showAll}
                className="m-chip shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              >
                {ui.all}
                <span className="ml-1.5 text-xs opacity-60">{totalItems}</span>
              </button>
            )}
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

        <main className="@container relative mx-auto max-w-2xl overflow-x-clip px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)]">
          {visibleCategories.length === 0 && (
            <p className="m-muted py-16 text-center">{searching ? ui.noMatch.replace("{q}", query) : ui.empty}</p>
          )}
          {visibleCategories.map((c) => renderCategory(c, !searching && enterDir ? `m-enter-${enterDir}` : ""))}

          {!searching && menu.categories.length > 1 && (
            <div className="mt-8 flex items-stretch gap-2">
              {prevCategory && (
                <button
                  type="button"
                  onClick={() => selectCategory(prevCategory.id)}
                  className={`m-surface flex min-w-0 items-center gap-2 p-4 text-left ${nextCategory ? "w-[38%] shrink-0" : "flex-1"}`}
                >
                  <span aria-hidden className="m-price text-lg">
                    ←
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="m-muted block text-xs">{ui.prev}</span>
                    <span className="block truncate font-semibold">{catName(prevCategory)}</span>
                  </span>
                </button>
              )}
              {nextCategory ? (
                <button
                  type="button"
                  onClick={() => selectCategory(nextCategory.id, "next")}
                  className="m-surface flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
                >
                  <PullRing progress={pull?.dir === "next" ? pull.progress : 0} />
                  <span className="min-w-0 flex-1">
                    <span className="m-muted block truncate text-xs">
                      {ui.next} · {ui.keepScrolling}
                    </span>
                    <span className="block truncate font-semibold">{catName(nextCategory)}</span>
                  </span>
                  <span aria-hidden className="m-price text-lg" style={{ transform: `translateY(${(pull?.dir === "next" ? pull.progress : 0) * 6}px)` }}>
                    ↓
                  </span>
                </button>
              ) : (
                <p className="m-muted flex flex-1 items-center justify-center text-center text-sm">— {ui.endOfMenu} —</p>
              )}
            </div>
          )}
        </main>
      </ClickSpark>
    </div>
  );
}

interface ItemCardProps {
  item: MenuItem;
  layout: LayoutKey;
  lang: LangCode;
  locale: string;
  currency: string;
  soldOutLabel: string;
}

function ItemCard({ item, layout, lang, locale, currency, soldOutLabel }: ItemCardProps) {
  const name = translate(item.name, item.translations, lang, "name") ?? "";
  const description = translate(item.description, item.translations, lang, "description");
  const dim = item.isAvailable ? "" : "opacity-50";
  const soldOut = !item.isAvailable && <span className="m-chip rounded-full px-2 py-0.5 text-xs font-medium">{soldOutLabel}</span>;
  const money = (amount: number) => <span className={item.isAvailable ? "m-price" : ""}>{formatPrice(amount, currency, locale)}</span>;
  const price = money(item.price);
  // Variants with their own price (Hot / Iced, sizes…), shown instead of the single price.
  // `?? []`: menu data cached before options existed (up to 30 s after a deploy) has no `options`.
  const options = (item.options ?? []).map((o, i) => ({ key: i, name: translate(o.name, o.translations, lang, "name"), price: money(o.price) }));
  const hasOptions = options.length > 0;
  const photo = (className: string) =>
    item.imageKey ? (
      <img src={imageUrl(item.imageKey)} alt={name} loading="lazy" decoding="async" draggable={false} className={`m-img object-cover ${className}`} />
    ) : null;

  if (layout === "grid") {
    return (
      <div className={`flex w-full flex-col ${dim}`}>
        <div className="relative">
          {photo("aspect-square w-full") ?? (
            // No photo: a tinted tile with the item's initial keeps the grid even.
            <div
              aria-hidden
              className="m-img m-price grid aspect-square w-full place-items-center text-4xl font-bold"
              style={{ background: "color-mix(in srgb, var(--m-primary) 12%, transparent)" }}
            >
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          {soldOut && <span className="absolute left-1.5 top-1.5">{soldOut}</span>}
        </div>
        <h3 className="mt-2 px-0.5 text-sm font-semibold leading-snug">{name}</h3>
        {hasOptions ? (
          <ul className="mt-auto space-y-0.5 px-0.5 pt-1 text-sm">
            {options.map((o) => (
              <li key={o.key} className="flex items-baseline justify-between gap-2">
                <span className="m-muted min-w-0 truncate">{o.name}</span>
                <span className="shrink-0 font-semibold">{o.price}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-auto px-0.5 pt-1 text-sm font-semibold">{price}</p>
        )}
      </div>
    );
  }

  if (layout === "column") {
    return (
      <div className={`w-full ${dim}`}>
        {photo("aspect-[4/3] w-full mb-3")}
        <div className="flex items-start gap-3 px-1 pb-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-snug">{name}</h3>
            {description && <p className="m-muted mt-1 text-sm">{description}</p>}
          </div>
          <div className="shrink-0 text-right font-semibold">
            {hasOptions ? (
              <ul className="space-y-0.5">
                {options.map((o) => (
                  <li key={o.key}>
                    <span className="m-muted mr-2 text-sm font-normal">{o.name}</span>
                    {o.price}
                  </li>
                ))}
              </ul>
            ) : (
              price
            )}
            {soldOut && <span className="mt-1 block">{soldOut}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full gap-4 py-1.5 pl-1.5 ${dim}`}>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{name}</h3>
        {description && <p className="m-muted mt-0.5 text-sm">{description}</p>}
        {hasOptions ? (
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {options.map((o) => (
              <li key={o.key}>
                <span className="m-muted mr-1.5 text-sm">{o.name}</span>
                <span className="font-semibold">{o.price}</span>
              </li>
            ))}
            {soldOut && <li>{soldOut}</li>}
          </ul>
        ) : (
          <p className="mt-2 font-semibold">
            {price}
            {soldOut && <span className="ml-2">{soldOut}</span>}
          </p>
        )}
      </div>
      {photo("size-24 shrink-0")}
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

/** Hue (0–360) of a #rrggbb colour. */
function hueOf(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 30; // grey: fall back to a warm tone
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * Gradient colours for the restaurant name: bright, light versions of the theme's two header
 * colours, so the text stays readable on the header. Similar hues get pulled apart a little so
 * the gradient is always visible.
 */
function brandColors(theme: MenuTheme) {
  const from = hueOf(theme.primary);
  let to = hueOf(theme.headerColor2);
  const gap = Math.abs(((to - from + 540) % 360) - 180);
  if (gap < 35) to = (from + 45) % 360;
  return {
    "--m-brand-from": `hsl(${from.toFixed(0)} 95% 82%)`,
    "--m-brand-to": `hsl(${to.toFixed(0)} 95% 78%)`,
    "--m-glint": mixHex(theme.headerColor2, "#ffffff", 0.55),
  } as CSSProperties;
}

/** Blend two #rrggbb colours; amount 0 = a, 1 = b. */
function mixHex(a: string, b: string, amount: number) {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ca, cb] = [channels(a), channels(b)];
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}
