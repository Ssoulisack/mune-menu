import { useMemo, useState, type FormEvent } from "react";
import type { CategoryDTO, SettingsDTO } from "../../../shared/types";
import { LANGUAGES } from "../../../shared/i18n";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { ConfirmButton } from "../../components/ConfirmButton";
import { otherLanguages, TranslationFields } from "../../components/TranslationFields";
import { DragHandle, SortableList } from "../../components/SortableList";
import { Button, Card, ErrorNote, Input, PageTitle, Toggle } from "../../components/ui";
import { usePreviewDraft, usePreviewFocus, type PreviewDraft } from "../../components/preview/PreviewContext";
import { applyCategoryDraft, sameValue } from "../../components/preview/drafts";

export default function Categories() {
  const { data: categories, setData, error: loadError, reload } = useFetch<CategoryDTO[]>("/api/admin/categories");
  const [newName, setNewName] = useState("");
  const { data: settings } = useFetch<SettingsDTO>("/api/admin/settings");
  const [editing, setEditing] = useState<Pick<CategoryDTO, "id" | "name" | "translations"> | null>(null);
  const extraLangs = otherLanguages(settings?.languages, settings?.defaultLanguage);

  // Live preview: follow the category being renamed and show the new name as it's typed.
  const original = categories?.find((c) => c.id === editing?.id);
  const renameDraft = useMemo<PreviewDraft | null>(() => {
    if (!editing || !original || sameValue([editing.name, editing.translations], [original.name, original.translations])) return null;
    return (menu) => applyCategoryDraft(menu, editing);
  }, [editing, original]);
  usePreviewDraft("category-rename", renameDraft);
  usePreviewFocus(editing?.id);
  const [error, setError] = useState<string | null>(null);

  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    reload();
  }

  function add(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    mutate(() => api.post("/api/admin/categories", { name: newName })).then(() => setNewName(""));
  }

  function rename(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    mutate(() => api.put(`/api/admin/categories/${editing.id}`, { name: editing.name, translations: editing.translations })).then(() => setEditing(null));
  }

  function reorder(reordered: CategoryDTO[]) {
    setData(reordered);
    mutate(() => api.put("/api/admin/categories/reorder", { ids: reordered.map((c) => c.id) }));
  }

  return (
    <>
      <PageTitle>Categories</PageTitle>
      <div className="space-y-4">
        <Card>
          <form onSubmit={add} className="flex gap-2">
            <Input placeholder="New category, e.g. ກາເຟ" maxLength={80} value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button type="submit" disabled={!newName.trim()}>
              Add
            </Button>
          </form>
        </Card>

        <ErrorNote message={error ?? loadError} />

        <Card className="p-0!">
          {categories?.length === 0 && <p className="px-5 py-4 text-sm text-stone-500">No categories yet.</p>}
          <SortableList
            items={categories ?? []}
            onReorder={reorder}
            className="divide-y divide-stone-100 overflow-hidden rounded-xl"
            renderItem={(c, handle) => (
              <div className="flex items-start gap-3 py-3 pl-2 pr-5 [&>*:not(form)]:self-center">
                <DragHandle {...handle} label={`Reorder ${c.name}`} />

                {editing?.id === c.id ? (
                  <form onSubmit={rename} className="flex-1 space-y-3">
                    <Input
                      autoFocus
                      maxLength={80}
                      aria-label={`Name (${settings ? LANGUAGES[settings.defaultLanguage].label : ""})`}
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                    <TranslationFields
                      languages={extraLangs}
                      value={editing.translations}
                      onChange={(translations) => setEditing({ ...editing, translations })}
                      fields={[{ key: "name", label: "Name", maxLength: 80, base: editing.name }]}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button className="flex-1 text-left hover:underline" onClick={() => setEditing({ id: c.id, name: c.name, translations: c.translations })}>
                      <span className="font-medium">{c.name}</span>
                      {extraLangs.map((l) => c.translations[l]?.name && (
                        <span key={l} className="ml-2 text-sm text-stone-500">· {c.translations[l]?.name}</span>
                      ))}
                      {extraLangs.some((l) => !c.translations[l]?.name) && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">needs translation</span>
                      )}
                    </button>
                    <span className="text-xs text-stone-500">{c.isActive ? "Visible" : "Hidden"}</span>
                    <Toggle checked={c.isActive} label={`${c.name} visible`} onChange={(isActive) => mutate(() => api.put(`/api/admin/categories/${c.id}`, { isActive }))} />
                    <ConfirmButton
                      onConfirm={() => mutate(() => api.del(`/api/admin/categories/${c.id}`))}
                      title={`Delete category “${c.name}”?`}
                      message={
                        <>
                          <strong className="text-red-700">All items in this category</strong> and their photos will be deleted too. To keep the
                          items, move them to another category first, or just hide the category. This can't be undone.
                        </>
                      }
                      confirmLabel="Delete category"
                    >
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </div>
            )}
          />
        </Card>
        <p className="text-sm text-stone-500">Deleting a category also deletes all of its items. Hide it instead if you only want to take it off the menu for now.</p>
      </div>
    </>
  );
}
