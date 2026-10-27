import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import type { SeasonDTO, SettingsDTO } from "../../../shared/types";
import { LANGUAGES } from "../../../shared/i18n";
import { CORNERS, DECORATION_KEYS, DECORATIONS, DEFAULT_THEME, FONTS, LAYOUT_KEYS, LAYOUTS, THEME_PRESETS, type MenuTheme } from "../../../shared/theme";
import { api } from "../../lib/api";
import { daysInMonth, MONTH_NAMES } from "../../lib/dates";
import { useFetch } from "../../lib/useFetch";
import { ConfirmButton } from "../../components/ConfirmButton";
import { ImageUpload } from "../../components/ImageUpload";
import { ThemeSwatch } from "../../components/ThemeSwatch";
import { LayoutIcon } from "../../components/LayoutIcon";
import { Button, Card, ErrorNote, Field, Input, PageTitle, Select } from "../../components/ui";
import { usePreview, usePreviewDraft, type PreviewDraft } from "../../components/preview/PreviewContext";
import { applyThemeDraft, sameValue } from "../../components/preview/drafts";

type SeasonFields = Pick<SeasonDTO, "name" | "startDate" | "endDate" | "isActive">;

/** Edits the default theme (/admin/themes/default) or a season (/admin/themes/new, /admin/themes/:id). */
export default function ThemeEditorPage() {
  const { id = "new" } = useParams();
  // Remount per id so state from one theme never leaks into another.
  return <ThemeEditor key={id} id={id} />;
}

function ThemeEditor({ id }: { id: string }) {
  const isDefault = id === "default";
  const isNew = id === "new";
  const navigate = useNavigate();

  const { data: settings } = useFetch<SettingsDTO>("/api/admin/settings");
  // Seasons need the default theme too: one saved before it had a layout uses the default's layout.
  const { data: loadedDefault } = useFetch<MenuTheme>("/api/admin/theme");
  const { data: loadedSeason, error: loadError } = useFetch<SeasonDTO>(!isDefault && !isNew ? `/api/admin/seasons/${id}` : null);

  const [theme, setTheme] = useState<MenuTheme | null>(isNew ? DEFAULT_THEME : null);
  const [season, setSeason] = useState<SeasonFields>({ name: "", startDate: "04-13", endDate: "04-16", isActive: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const savedSeasonTheme = useMemo(
    () => (loadedSeason && loadedDefault ? { ...DEFAULT_THEME, layout: loadedDefault.layout, ...(loadedSeason.theme as Partial<MenuTheme>) } : undefined),
    [loadedSeason, loadedDefault],
  );

  useEffect(() => {
    if (isDefault && loadedDefault) setTheme(loadedDefault);
  }, [isDefault, loadedDefault]);

  useEffect(() => {
    if (!loadedSeason || !savedSeasonTheme) return;
    const { theme: _, ...fields } = loadedSeason;
    setTheme(savedSeasonTheme);
    setSeason(fields);
  }, [loadedSeason, savedSeasonTheme]);

  // Live preview always shows the theme being edited (even a season that isn't running today).
  const { setLang: setPreviewLang } = usePreview();
  const savedTheme = isDefault ? loadedDefault : savedSeasonTheme;
  const unsaved = isNew || !sameValue(theme, savedTheme);
  const themeDraft = useMemo<PreviewDraft | null>(() => (theme ? (menu) => applyThemeDraft(menu, theme) : null), [theme]);
  const themeName = isDefault ? "default theme" : season.name || "new season";
  usePreviewDraft("theme-editor", themeDraft, unsaved ? "unsaved changes" : `previewing ${themeName}`);

  const set = <K extends keyof MenuTheme>(key: K, value: MenuTheme[K]) => setTheme((t) => (t ? { ...t, [key]: value } : t));

  function applyPreset(preset: (typeof THEME_PRESETS)[number]) {
    // Keep the owner's uploaded header photo and layout when switching presets.
    setTheme((t) => ({ ...preset.theme, layout: t?.layout ?? preset.theme.layout, headerImageKey: t?.headerImageKey ?? null, headerStyle: t?.headerStyle === "image" ? "image" : preset.theme.headerStyle }));
    if (isNew && !season.name) setSeason((s) => ({ ...s, name: preset.name }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!theme) return;
    setSaving(true);
    setError(null);
    try {
      if (isDefault) await api.put("/api/admin/theme", theme);
      else if (isNew) await api.post("/api/admin/seasons", { ...season, theme });
      else await api.put(`/api/admin/seasons/${id}`, { ...season, theme });
      navigate("/admin/themes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  async function onDelete() {
    setSaving(true);
    try {
      await api.del(`/api/admin/seasons/${id}`);
      navigate("/admin/themes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setSaving(false);
    }
  }

  if (loadError) return <ErrorNote message={loadError} />;
  if (!theme || !settings) return <p className="text-stone-500">Loading…</p>;

  const languages = settings.languages;

  return (
    <>
      <PageTitle>{isDefault ? "Default theme" : isNew ? "New season" : `Edit season`}</PageTitle>
      <form onSubmit={onSubmit} className="space-y-4">
        {!isDefault && (
          <Card className="space-y-4">
            <Field label="Season name">
              <Input required maxLength={80} value={season.name} onChange={(e) => setSeason({ ...season, name: e.target.value })} placeholder="Pi Mai Lao" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">
                <MonthDayInput value={season.startDate} onChange={(startDate) => setSeason({ ...season, startDate })} />
              </Field>
              <Field label="Ends (inclusive)">
                <MonthDayInput value={season.endDate} onChange={(endDate) => setSeason({ ...season, endDate })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={season.isActive} onChange={(e) => setSeason({ ...season, isActive: e.target.checked })} />
              Enabled — switch on automatically every year
            </label>
          </Card>
        )}

        <Card className="space-y-3">
          <h2 className="font-semibold">Start from a preset</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg p-1.5 text-left ring-1 ring-stone-200 hover:ring-stone-900"
              >
                <ThemeSwatch theme={p.theme} className="h-12 w-full" />
                <span className="mt-1 block truncate text-xs font-medium">
                  {p.emoji} {p.name}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Customize</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ColorField label="Main color" value={theme.primary} onChange={(v) => set("primary", v)} />
            <ColorField label="Second color" value={theme.headerColor2} onChange={(v) => set("headerColor2", v)} />
            <ColorField label="Background" value={theme.background} onChange={(v) => set("background", v)} />
            <ColorField label="Cards" value={theme.surface} onChange={(v) => set("surface", v)} />
            <ColorField label="Text" value={theme.text} onChange={(v) => set("text", v)} />
          </div>

          <Field label="Header">
            <Segmented
              value={theme.headerStyle}
              onChange={(v) => set("headerStyle", v)}
              options={[
                ["solid", "Solid color"],
                ["gradient", "Gradient"],
                ["image", "Photo"],
              ]}
            />
          </Field>
          {theme.headerStyle === "image" && (
            <Field label="Header photo" hint="A wide photo works best. It's darkened slightly so the text stays readable.">
              <ImageUpload value={theme.headerImageKey} onChange={(key) => set("headerImageKey", key)} />
            </Field>
          )}

          <Field label="Decoration">
            <Select value={theme.decoration} onChange={(e) => set("decoration", e.target.value as MenuTheme["decoration"])}>
              {DECORATION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {DECORATIONS[k].symbols.slice(0, 2).join(" ")} {DECORATIONS[k].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Font">
            <Segmented value={theme.font} onChange={(v) => set("font", v)} options={Object.entries(FONTS).map(([k, f]) => [k as MenuTheme["font"], f.label])} />
          </Field>
          <Field label="Corners">
            <Segmented value={theme.corners} onChange={(v) => set("corners", v)} options={Object.entries(CORNERS).map(([k, c]) => [k as MenuTheme["corners"], c.label])} />
          </Field>
          <Field label="Item layout" hint={`${LAYOUTS[theme.layout].hint}. Customers can still switch layout on the menu.`}>
            <Segmented value={theme.layout} onChange={(v) => set("layout", v)} options={LAYOUT_KEYS.map((k) => [k, <LayoutIcon key={k} layout={k} label={LAYOUTS[k].label} />])} />
          </Field>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Banner message</h2>
          <p className="-mt-2 text-sm text-stone-500">Optional strip under the header, e.g. a greeting or a seasonal promotion.</p>
          {languages.map((code) => (
            <Field key={code} label={LANGUAGES[code].label}>
              <Input
                lang={code}
                maxLength={200}
                value={theme.banner[code] ?? ""}
                onChange={(e) => set("banner", { ...theme.banner, [code]: e.target.value })}
                onFocus={() => setPreviewLang(code)}
              />
            </Field>
          ))}
        </Card>

        <ErrorNote message={error} />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save theme"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/admin/themes")}>
            Cancel
          </Button>
          {!isDefault && !isNew && (
            <div className="ml-auto">
              <ConfirmButton onConfirm={onDelete} disabled={saving}>
                Delete season
              </ConfirmButton>
            </div>
          )}
        </div>
      </form>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg p-1.5 ring-1 ring-stone-200">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent" />
      <span className="min-w-0">
        <span className="block text-xs font-medium">{label}</span>
        <span className="block font-mono text-xs text-stone-500">{value}</span>
      </span>
    </label>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, ReactNode][] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${v === value ? "bg-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MonthDayInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [month, day] = value.split("-").map(Number);
  const emit = (m: number, d: number) => onChange(`${String(m).padStart(2, "0")}-${String(Math.min(d, daysInMonth(m))).padStart(2, "0")}`);
  return (
    <div className="flex gap-2">
      <Select value={day} onChange={(e) => emit(month, Number(e.target.value))} aria-label="Day">
        {Array.from({ length: daysInMonth(month) }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </Select>
      <Select value={month} onChange={(e) => emit(Number(e.target.value), day)} aria-label="Month">
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </Select>
    </div>
  );
}
