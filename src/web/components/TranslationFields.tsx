import { LANGUAGES, type LangCode, type Translations } from "../../shared/i18n";
import { Input, Textarea } from "./ui";

interface FieldDef<F extends string> {
  key: F;
  label: string;
  multiline?: boolean;
  maxLength?: number;
  /** Main-language text, shown as a placeholder hint. */
  base?: string | null;
}

// Inputs for every enabled language other than the default one.
export function TranslationFields<F extends string>({
  languages,
  fields,
  value,
  onChange,
}: {
  languages: LangCode[];
  fields: FieldDef<F>[];
  value: Translations<F>;
  onChange: (value: Translations<F>) => void;
}) {
  if (!languages.length) return null;

  const set = (lang: LangCode, field: F, text: string) => onChange({ ...value, [lang]: { ...value[lang], [field]: text } });

  return (
    <div className="space-y-4">
      {languages.map((lang) => (
        <fieldset key={lang} className="space-y-2 rounded-lg border border-stone-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{LANGUAGES[lang].label}</legend>
          {fields.map((f) => {
            const props = {
              "aria-label": `${f.label} (${LANGUAGES[lang].label})`,
              placeholder: f.base ? `${f.label}: ${f.base}` : f.label,
              maxLength: f.maxLength,
              value: value[lang]?.[f.key] ?? "",
              lang,
            };
            return f.multiline ? (
              <Textarea key={f.key} rows={2} {...props} onChange={(e) => set(lang, f.key, e.target.value)} />
            ) : (
              <Input key={f.key} {...props} onChange={(e) => set(lang, f.key, e.target.value)} />
            );
          })}
        </fieldset>
      ))}
      <p className="text-xs text-stone-500">Leave a field empty to show the main text instead.</p>
    </div>
  );
}

export const otherLanguages = (languages: LangCode[] | undefined, defaultLanguage: LangCode | undefined) =>
  (languages ?? []).filter((l) => l !== defaultLanguage);
