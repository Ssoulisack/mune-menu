import { useMemo, useState } from "react";
import type { MediaDTO } from "../../../shared/types";
import { api, imageUrl } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { ConfirmButton } from "../../components/ConfirmButton";
import { Card, ErrorNote, PageTitle } from "../../components/ui";

const formatSize = (bytes: number | null) =>
  bytes === null ? "—" : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Unknown date");

// Every photo in Cloudflare storage, with what uses it. Unused photos (left behind by replaced
// header photos, abandoned uploads…) can be deleted; photos in use are protected.
export default function Media() {
  const { data: media, error: loadError, loading, reload } = useFetch<MediaDTO[]>("/api/admin/media");
  const [filter, setFilter] = useState<"all" | "unused">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unused = useMemo(() => media?.filter((m) => m.usedBy.length === 0) ?? [], [media]);
  const shown = filter === "unused" ? unused : (media ?? []);
  const totalSize = media?.reduce((sum, m) => sum + (m.size ?? 0), 0) ?? 0;
  const unusedSize = unused.reduce((sum, m) => sum + (m.size ?? 0), 0);

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function remove(keys: string[]) {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/admin/media/delete", { keys });
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
    setBusy(false);
    reload();
  }

  if (loadError) return <ErrorNote message={loadError} />;

  return (
    <>
      <PageTitle>Media</PageTitle>

      <Card className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <div className="text-2xl font-bold">{media?.length ?? "…"}</div>
          <div className="text-xs text-stone-500">photos · {formatSize(totalSize)}</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${unused.length ? "text-amber-600" : ""}`}>{media ? unused.length : "…"}</div>
          <div className="text-xs text-stone-500">not used · {formatSize(unusedSize)}</div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <ConfirmButton
              onConfirm={() => remove([...selected])}
              disabled={busy}
              title={`Delete ${selected.size} photo${selected.size === 1 ? "" : "s"}?`}
              message="They aren't used anywhere on the menu. They'll be removed from storage permanently."
              confirmLabel="Delete photos"
            >
              {`Delete selected (${selected.size})`}
            </ConfirmButton>
          )}
          {unused.length > 0 && selected.size === 0 && (
            <ConfirmButton
              onConfirm={() => remove(unused.map((m) => m.key))}
              disabled={busy}
              title={`Delete all ${unused.length} unused photo${unused.length === 1 ? "" : "s"}?`}
              message={`This frees ${formatSize(unusedSize)}. Photos used on the menu are kept. Deleted photos can't be recovered.`}
              confirmLabel="Delete photos"
            >
              {`Delete all unused (${unused.length})`}
            </ConfirmButton>
          )}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-lg bg-stone-200/70 p-1">
          {(["all", "unused"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === f ? "bg-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              {f === "all" ? "All" : `Not used (${unused.length})`}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">Photos in use can't be deleted here. Change the item or theme first.</p>
      </div>

      <ErrorNote message={error} />

      {loading && !media && <p className="text-stone-500">Loading…</p>}
      {media && shown.length === 0 && (
        <Card className="py-10 text-center text-sm text-stone-500">
          {filter === "unused" ? "No unused photos. Storage is clean ✓" : "No photos uploaded yet. Add them on an item, in Settings (logo) or in a theme (header photo)."}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((m) => {
          const isUnused = m.usedBy.length === 0;
          const isSelected = selected.has(m.key);
          return (
            <div
              key={m.key}
              className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${isSelected ? "ring-2 ring-red-400" : "ring-stone-200"}`}
            >
              <a href={imageUrl(m.key)} target="_blank" rel="noreferrer" className="relative block aspect-square bg-stone-100">
                <img src={imageUrl(m.key)} alt="" loading="lazy" className="size-full object-cover" />
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${isUnused ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                  {isUnused ? "Not used" : "In use"}
                </span>
              </a>
              <div className="space-y-1 p-3 text-xs">
                {isUnused ? (
                  <label className="flex cursor-pointer items-center gap-2 font-medium text-stone-700">
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(m.key)} />
                    Select to delete
                  </label>
                ) : (
                  <ul className="space-y-0.5 font-medium text-stone-700">
                    {m.usedBy.map((u) => (
                      <li key={u} className="truncate" title={u}>
                        {u}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-stone-500">
                  {formatSize(m.size)} · {formatDate(m.uploadedAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
