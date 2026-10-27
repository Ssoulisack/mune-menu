import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SettingsDTO } from "../../../shared/types";
import { LANG_CODES, LANGUAGES, type LangCode } from "../../../shared/i18n";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { ImageUpload } from "../../components/ImageUpload";
import { otherLanguages, TranslationFields } from "../../components/TranslationFields";
import { Button, Card, ErrorNote, Field, Input, PageTitle, Select } from "../../components/ui";
import { usePreviewDraft, type PreviewDraft } from "../../components/preview/PreviewContext";
import { applySettingsDraft, sameValue } from "../../components/preview/drafts";

export default function Settings() {
  const { data, setData, error: loadError } = useFetch<SettingsDTO>("/api/admin/settings");
  const [form, setForm] = useState<SettingsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  // Live preview: name, info, languages and translations as they're typed.
  const settingsDraft = useMemo<PreviewDraft | null>(() => {
    if (!form || sameValue(form, data)) return null;
    return (menu) => applySettingsDraft(menu, form);
  }, [form, data]);
  usePreviewDraft("settings", settingsDraft);

  const set = <K extends keyof SettingsDTO>(key: K, value: SettingsDTO[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setStatus("idle");
  };

  function toggleLanguage(code: LangCode, on: boolean) {
    if (!form) return;
    const languages = on ? LANG_CODES.filter((l) => l === code || form.languages.includes(l)) : form.languages.filter((l) => l !== code);
    if (!languages.length) return;
    setForm({ ...form, languages, defaultLanguage: languages.includes(form.defaultLanguage) ? form.defaultLanguage : languages[0] });
    setStatus("idle");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setStatus("saving");
    setError(null);
    try {
      const saved = await api.put<SettingsDTO>("/api/admin/settings", form);
      setForm(saved);
      setData(saved); // new baseline, so the preview stops showing "unsaved changes"
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStatus("idle");
    }
  }

  if (loadError) return <ErrorNote message={loadError} />;
  if (!form) return <p className="text-stone-500">Loading…</p>;

  const mainLabel = LANGUAGES[form.defaultLanguage].label;
  const extraLangs = otherLanguages(form.languages, form.defaultLanguage);

  return (
    <>
      <PageTitle>Restaurant settings</PageTitle>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-4">
          <h2 className="font-semibold">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {LANG_CODES.map((code) => (
              <label
                key={code}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ${form.languages.includes(code) ? "bg-stone-900 text-white ring-stone-900" : "bg-white ring-stone-300"}`}
              >
                <input type="checkbox" className="sr-only" checked={form.languages.includes(code)} onChange={(e) => toggleLanguage(code, e.target.checked)} />
                {LANGUAGES[code].label}
              </label>
            ))}
          </div>
          <Field label="Main language" hint="Names and descriptions you type in the main fields are in this language. Customers see it first unless their phone prefers another enabled language.">
            <Select value={form.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value as LangCode)}>
              {form.languages.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGES[code].label}
                </option>
              ))}
            </Select>
          </Field>
          {data && form.defaultLanguage !== data.defaultLanguage && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Changing the main language doesn't translate anything. Existing names are treated as {mainLabel} from now on.
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Restaurant info</h2>
          <Field label="Logo">
            <ImageUpload value={form.logoKey} onChange={(key) => set("logoKey", key)} />
          </Field>
          <Field label={`Restaurant name (${mainLabel})`}>
            <Input required maxLength={120} value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} />
          </Field>
          <Field label={`Tagline (${mainLabel})`}>
            <Input maxLength={200} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label={`Opening hours (${mainLabel})`}>
            <Input maxLength={200} value={form.openingHours ?? ""} onChange={(e) => set("openingHours", e.target.value)} placeholder="07:00 – 19:00" />
          </Field>
          <Field label={`Address (${mainLabel})`}>
            <Input maxLength={300} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency code" hint="e.g. LAK, THB, USD. Changing it does not convert existing prices.">
              <Input required maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Timezone" hint="Used to switch seasonal themes at local midnight.">
              <Input required value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Vientiane" />
            </Field>
          </div>
        </Card>

        {extraLangs.length > 0 && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Translations</h2>
            <TranslationFields
              languages={extraLangs}
              value={form.translations}
              onChange={(t) => set("translations", t)}
              fields={[
                { key: "restaurantName", label: "Restaurant name", maxLength: 120, base: form.restaurantName },
                { key: "tagline", label: "Tagline", maxLength: 200, base: form.tagline },
                { key: "openingHours", label: "Opening hours", maxLength: 200, base: form.openingHours },
                { key: "address", label: "Address", maxLength: 300, base: form.address },
              ]}
            />
          </Card>
        )}

        <ErrorNote message={error} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save settings"}
          </Button>
          {status === "saved" && <span className="text-sm text-emerald-700">Saved ✓</span>}
        </div>
      </form>
    </>
  );
}
