import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { CategoryDTO, ItemDTO, SettingsDTO } from "../../../shared/types";
import { LANGUAGES } from "../../../shared/i18n";
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
}

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
    };
    return (menu: Parameters<typeof applyItemDraft>[0]) => applyItemDraft(menu, draft, categories);
  }, [form, dirty, categories, isNew, id, currency, item]);
  usePreviewDraft("item-form", previewDraft);
  usePreviewFocus(form ? Number(form.categoryId) : null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = parsePriceInput(form.price, currency);
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
            <Field label={`Price (${currency})`}>
              <Input required inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder={pricePlaceholder(currency)} />
            </Field>
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

        {otherLanguages(settings?.languages, settings?.defaultLanguage).length > 0 && (
          <Card className="space-y-3">
            <h2 className="font-semibold">Translations</h2>
            <TranslationFields
              languages={otherLanguages(settings?.languages, settings?.defaultLanguage)}
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
