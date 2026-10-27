import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { CategoryDTO, ItemDTO, SettingsDTO } from "../../../shared/types";
import { api, imageUrl } from "../../lib/api";
import { formatPrice } from "../../lib/money";
import { useFetch } from "../../lib/useFetch";
import { Button, Card, ErrorNote, PageTitle, Select, Toggle } from "../../components/ui";
import { DragHandle, SortableList } from "../../components/SortableList";
import { usePreviewFocus } from "../../components/preview/PreviewContext";

export default function Items() {
  const [params, setParams] = useSearchParams();
  const filter = params.get("category") ?? "";
  const { data: categories } = useFetch<CategoryDTO[]>("/api/admin/categories");
  const { data: settings } = useFetch<SettingsDTO>("/api/admin/settings");
  const { data: items, setData: setItems, error: loadError, loading, reload } = useFetch<ItemDTO[]>("/api/admin/items");
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!categories || !items) return [];
    return categories
      .filter((c) => !filter || String(c.id) === filter)
      .map((c) => ({ category: c, items: items.filter((i) => i.categoryId === c.id) }));
  }, [categories, items, filter]);

  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      reload();
    }
  }

  function setAvailability(item: ItemDTO, isAvailable: boolean) {
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isAvailable } : i)) ?? null);
    mutate(() => api.patch(`/api/admin/items/${item.id}/availability`, { isAvailable }));
  }

  function reorder(reordered: ItemDTO[]) {
    const order = new Map(reordered.map((i, n) => [i.id, n]));
    setItems((prev) => prev?.map((i) => (order.has(i.id) ? { ...i, sortOrder: order.get(i.id)! } : i)).sort((a, b) => a.sortOrder - b.sortOrder) ?? null);
    mutate(() => api.put("/api/admin/items/reorder", { ids: reordered.map((i) => i.id) }));
  }

  usePreviewFocus(filter ? Number(filter) : null);

  const currency = settings?.currency ?? "LAK";
  const extraLangs = settings ? settings.languages.filter((l) => l !== settings.defaultLanguage) : [];
  const noCategories = categories && categories.length === 0;

  return (
    <>
      <PageTitle
        action={
          !noCategories && (
            <Link to={`/admin/items/new${filter ? `?category=${filter}` : ""}`}>
              <Button>+ Add item</Button>
            </Link>
          )
        }
      >
        Menu items
      </PageTitle>

      <div className="mb-4 flex items-center gap-3">
        <div className="w-60">
          <Select value={filter} onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})}>
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <span className="text-sm text-stone-500">Drag ⠿ to reorder. Toggle = available today; turn off when sold out.</span>
      </div>

      <div className="space-y-4">
        <ErrorNote message={error ?? loadError} />
        {loading && !items && <p className="text-stone-500">Loading…</p>}
        {noCategories && (
          <Card>
            Create a category first, e.g. “Drinks”.{" "}
            <Link to="/admin/categories" className="font-medium underline">
              Go to categories →
            </Link>
          </Card>
        )}

        {groups.map(({ category, items: list }) => (
          <Card key={category.id} className="p-0!">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
              <h2 className="font-semibold">
                {category.name}
                {!category.isActive && <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-600">hidden</span>}
              </h2>
              <span className="text-sm text-stone-500">{list.length} items</span>
            </div>
            {list.length === 0 && <p className="px-5 py-4 text-sm text-stone-500">No items yet.</p>}
            <SortableList
              items={list}
              onReorder={reorder}
              className="divide-y divide-stone-100 overflow-hidden rounded-b-xl"
              renderItem={(item, handle) => (
                <div className="flex items-center gap-3 py-3 pl-2 pr-5">
                  <DragHandle {...handle} label={`Reorder ${item.name}`} />
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.imageKey && <img src={imageUrl(item.imageKey)} alt="" className="size-full object-cover" />}
                  </div>
                  <Link to={`/admin/items/${item.id}`} className="min-w-0 flex-1 hover:underline">
                    <div className="truncate font-medium">
                      {item.name}
                      {!item.isActive && <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-600">hidden</span>}
                      {extraLangs.some((l) => !item.translations[l]?.name) && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">needs translation</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-stone-500">
                      {item.options?.length
                        ? item.options.map((o) => `${o.name} ${formatPrice(o.price, currency)}`).join(" · ")
                        : formatPrice(item.price, currency)}
                    </div>
                  </Link>
                  <Toggle checked={item.isAvailable} onChange={(v) => setAvailability(item, v)} label={`${item.name} available`} />
                </div>
              )}
            />
          </Card>
        ))}
      </div>
    </>
  );
}
