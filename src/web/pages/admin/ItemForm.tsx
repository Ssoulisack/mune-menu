import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { CategoryDTO, ItemDTO, SettingsDTO } from "../../../shared/types";
import { LANGUAGES, type LangCode } from "../../../shared/i18n";
import { api } from "../../lib/api";
import { parsePriceInput, pricePlaceholder, toPriceInput } from "../../lib/money";
import { useFetch } from "../../lib/useFetch";
import { ConfirmButton } from "../../components/ConfirmButton";
import { ImageUpload } from "../../components/ImageUpload";
import { otherLanguages, TranslationFields } from "../../components/TranslationFields";
import { Button, Card, ErrorNote, Field, Input, PageTitle, Select, Textarea } from "../../components/ui";
import { usePreviewDraft, usePreviewFocus } from "../../components/preview/PreviewContext";
import { applyItemDraft, sameValue } from "../../components/preview/drafts";

interface FormState {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageKey: string | null;
  isAvailable: boolean;
  isActive: boolean;
  translations: ItemDTO["translations"];
  options: OptionState[];
}

interface OptionState {
  name: string;
  price: string;
  translations: ItemDTO["options"][number]["translations"];
}

const MAX_OPTIONS = 12;

export default function ItemForm() {
  const { id } = useParams();
  const isNew = !id;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: categories } = useFetch<CategoryDTO[]>("/api/admin/categories");
  const { data: settings } = useFetch<SettingsDTO>("/api/admin/settings");
  const { data: item, error: loadError } = useFetch<ItemDTO>(isNew ? null : `/api/admin/items/${id}`);
  const [form, setForm] = useState<FormState | null>(null);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currency = settings?.currency ?? "LAK";

  useEffect(() => {
    if (form || !settings || !categories) return;
    let initial: FormState | null = null;
    if (isNew) {
      initial = {
        categoryId: params.get("category") ?? String(categories[0]?.id ?? ""),
        name: "",
        description: "",
        price: "",
        imageKey: null,
        isAvailable: true,
        isActive: true,
        translations: {},
        options: [],
      };
    } else if (item) {
      initial = {
        categoryId: String(item.categoryId),
        name: item.name,
        description: item.description ?? "",
        price: toPriceInput(item.price, currency),
        imageKey: item.imageKey,
        isAvailable: item.isAvailable,
        isActive: item.isActive,
        translations: item.translations,
        options: (item.options ?? []).map((o) => ({ name: o.name, price: toPriceInput(o.price, currency), translations: o.translations })),
      };
    }
    if (initial) {
      setForm(initial);
      setInitialForm(initial);
    }
  }, [form, settings, categories, item, isNew, params, currency]);

  // Live preview: show the item as typed, before saving.
  const dirty = form !== null && (isNew ? form.name.trim() !== "" : !sameValue(form, initialForm));
  const previewDraft = useMemo(() => {
    if (!form || !dirty || !categories) return null;
    const options = form.options
      .map((o) => ({ name: o.name.trim(), price: parsePriceInput(o.price, currency), translations: o.translations }))
      .filter((o): o is ItemDTO["options"][number] => o.name !== "" && o.price !== null);
    const draft = {
      id: isNew ? null : Number(id),
      categoryId: Number(form.categoryId),
      name: form.name,
      description: form.description || null,
      price: parsePriceInput(form.price, currency) ?? item?.price ?? 0,
      imageKey: form.imageKey,
      isAvailable: form.isAvailable,
      isActive: form.isActive,
      translations: form.translations,
      options,
    };
    return (menu: Parameters<typeof applyItemDraft>[0]) => applyItemDraft(menu, draft, categories);
  }, [form, dirty, categories, isNew, id, currency, item]);
  usePreviewDraft("item-form", previewDraft);
  usePreviewFocus(form ? Number(form.categoryId) : null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const setOption = (index: number, patch: Partial<OptionState>) =>
    setForm((f) => (f ? { ...f, options: f.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) } : f));
  const addOption = () =>
    setForm((f) => (f ? { ...f, options: [...f.options, { name: "", price: f.options.length ? "" : f.price, translations: {} }] } : f));
  const removeOption = (index: number) => setForm((f) => (f ? { ...f, options: f.options.filter((_, i) => i !== index) } : f));
  const hasOptions = form ? form.options.length > 0 : false;
  const extraLangs = otherLanguages(settings?.languages, settings?.defaultLanguage);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    // Blank option rows are ignored; a named option needs a valid price.
    const filled = form.options.filter((o) => o.name.trim() || o.price.trim());
    const options = [];
    for (const o of filled) {
      const optionPrice = parsePriceInput(o.price, currency);
      if (!o.name.trim()) return setError("Every option needs a name");
      if (optionPrice === null) return setError(`Enter a valid price for “${o.name.trim()}”`);
      options.push({ name: o.name.trim(), price: optionPrice, translations: o.translations });
    }
    // With options, the item's own price is the cheapest option (the server enforces this too).
    const price = options.length ? Math.min(...options.map((o) => o.price)) : parsePriceInput(form.price, currency);
    if (price === null) return setError("Enter a valid price");
    setSaving(true);
    setError(null);
    const body = {
      categoryId: Number(form.categoryId),
      name: form.name,
      description: form.description,
      price,
      imageKey: form.imageKey,
      isAvailable: form.isAvailable,
      isActive: form.isActive,
      translations: form.translations,
      options,
    };
    try {
      if (isNew) await api.post("/api/admin/items", body);
      else await api.put(`/api/admin/items/${id}`, body);
      navigate(`/admin?category=${form.categoryId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  async function onDelete() {
    setSaving(true);
    try {
      await api.del(`/api/admin/items/${id}`);
      navigate("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setSaving(false);
    }
  }

  if (loadError) return <ErrorNote message={loadError} />;
  if (!form) return <p className="text-stone-500">Loading…</p>;

  return (
    <>
      <PageTitle>{isNew ? "New item" : "Edit item"}</PageTitle>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Photo">
            <ImageUpload value={form.imageKey} onChange={(key) => set("imageKey", key)} />
          </Field>
          <Field label={`Name (${LANGUAGES[settings!.defaultLanguage].label})`}>
            <Input required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={`Description (${LANGUAGES[settings!.defaultLanguage].label})`} hint="Optional. Ingredients, portion size, spice level…">
            <Textarea maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {hasOptions ? (
              <Field label={`Price (${currency})`} hint="Set per option below.">
                <Input disabled value="—" />
              </Field>
            ) : (
              <Field label={`Price (${currency})`}>
                <Input required inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder={pricePlaceholder(currency)} />
              </Field>
            )}
            <Field label="Category">
              <Select required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => set("isAvailable", e.target.checked)} />
              Available (uncheck to show as “Sold out”)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Visible on the public menu
            </label>
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="font-semibold">Options</h2>
            <p className="text-sm text-stone-500">Optional. Variants with their own price, e.g. Hot ₭38,000 / Iced ₭42,000, or sizes.</p>
          </div>
          {form.options.map((o, i) => (
            <OptionRow
              key={i}
              index={i}
              option={o}
              currency={currency}
              languages={extraLangs}
              onChange={(patch) => setOption(i, patch)}
              onRemove={() => removeOption(i)}
            />
          ))}
          {form.options.length < MAX_OPTIONS && (
            <Button type="button" variant="secondary" onClick={addOption}>
              + Add option
            </Button>
          )}
        </Card>

        {extraLangs.length > 0 && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Translations</h2>
            <TranslationFields
              languages={extraLangs}
              value={form.translations}
              onChange={(t) => set("translations", t)}
              fields={[
                { key: "name", label: "Name", maxLength: 120, base: form.name },
                { key: "description", label: "Description", multiline: true, maxLength: 1000, base: form.description },
              ]}
            />
          </Card>
        )}

        <ErrorNote message={error} />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {!isNew && (
            <div className="ml-auto">
              <ConfirmButton onConfirm={onDelete} disabled={saving}>
                Delete item
              </ConfirmButton>
            </div>
          )}
        </div>
      </form>
    </>
  );
}

function OptionRow({
  index,
  option,
  currency,
  languages,
  onChange,
  onRemove,
}: {
  index: number;
  option: OptionState;
  currency: string;
  languages: LangCode[];
  onChange: (patch: Partial<OptionState>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-stone-200 p-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Option ${index + 1} name`}
          maxLength={40}
          placeholder={index === 0 ? "e.g. Hot" : index === 1 ? "e.g. Iced" : "Option name"}
          value={option.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1"
        />
        <Input
          aria-label={`Option ${index + 1} price (${currency})`}
          inputMode="decimal"
          placeholder={pricePlaceholder(currency)}
          value={option.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="w-32! shrink-0"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove option ${index + 1}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-red-600"
        >
          ✕
        </button>
      </div>
      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <Input
              key={lang}
              lang={lang}
              aria-label={`Option ${index + 1} name (${LANGUAGES[lang].label})`}
              maxLength={40}
              placeholder={`${LANGUAGES[lang].label}${option.name ? `: ${option.name}` : ""}`}
              value={option.translations[lang]?.name ?? ""}
              onChange={(e) => onChange({ translations: { ...option.translations, [lang]: { name: e.target.value } } })}
              className="min-w-32 flex-1"
            />
          ))}
        </div>
      )}
    </div>
  );
}
