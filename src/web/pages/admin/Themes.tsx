import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { SeasonDTO } from "../../../shared/types";
import type { MenuTheme } from "../../../shared/theme";
import { api } from "../../lib/api";
import { formatMonthDay } from "../../lib/dates";
import { useFetch } from "../../lib/useFetch";
import { ThemeSwatch } from "../../components/ThemeSwatch";
import { Button, Card, ErrorNote, PageTitle, Toggle } from "../../components/ui";
import { usePreview, usePreviewDraft, type PreviewDraft } from "../../components/preview/PreviewContext";
import { applyThemeDraft } from "../../components/preview/drafts";

export default function Themes() {
  const { data: defaultTheme } = useFetch<MenuTheme>("/api/admin/theme");
  const { data, setData, error, reload } = useFetch<{ seasons: SeasonDTO[]; activeSeasonId: number | null }>("/api/admin/seasons");

  async function setActive(season: SeasonDTO, isActive: boolean) {
    setData((d) => d && { ...d, seasons: d.seasons.map((s) => (s.id === season.id ? { ...s, isActive } : s)) });
    await api.put(`/api/admin/seasons/${season.id}`, { isActive }).catch(() => undefined);
    reload();
  }

  const live = data?.seasons.find((s) => s.id === data.activeSeasonId);

  // "Preview" shows any theme in the live preview, e.g. Christmas in October.
  const { setOpen } = usePreview();
  const [previewing, setPreviewing] = useState<{ key: string; name: string; theme: MenuTheme } | null>(null);
  const previewDraft = useMemo<PreviewDraft | null>(() => (previewing ? (menu) => applyThemeDraft(menu, previewing.theme) : null), [previewing]);
  usePreviewDraft("theme-pick", previewDraft, previewing ? `previewing ${previewing.name}` : undefined);

  function previewButton(k: string, name: string, theme: MenuTheme) {
    const active = previewing?.key === k;
    return (
      <Button
        variant="secondary"
        aria-pressed={active}
        className={active ? "bg-amber-50! ring-amber-300!" : ""}
        onClick={() => {
          setPreviewing(active ? null : { key: k, name, theme });
          if (!active) setOpen(true);
        }}
      >
        {active ? "Previewing" : "Preview"}
      </Button>
    );
  }

  return (
    <>
      <PageTitle
        action={
          <Link to="/admin/themes/new">
            <Button>+ Add season</Button>
          </Link>
        }
      >
        Menu themes
      </PageTitle>

      <div className="space-y-4">
        <ErrorNote message={error} />

        <Card className="flex items-center gap-3 bg-emerald-50! ring-emerald-200!">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm">
            Customers see right now: <strong>{live ? live.name : "Default theme"}</strong>
          </span>
        </Card>

        <Card className="flex items-center gap-4">
          {defaultTheme && <ThemeSwatch theme={defaultTheme} className="h-14 w-20 shrink-0" />}
          <div className="flex-1">
            <h2 className="font-semibold">Default theme</h2>
            <p className="text-sm text-stone-500">Used whenever no season is running.</p>
          </div>
          {defaultTheme && previewButton("default", "default theme", defaultTheme)}
          <Link to="/admin/themes/default">
            <Button variant="secondary">Edit</Button>
          </Link>
        </Card>

        <h2 className="pt-2 font-semibold">Seasons</h2>
        <p className="-mt-2 text-sm text-stone-500">Each season switches on automatically every year between its dates.</p>
        {data?.seasons.length === 0 && <Card className="text-sm text-stone-500">No seasons yet. Add one for Pi Mai, That Luang, Christmas…</Card>}
        {data?.seasons.map((s) => (
          <Card key={s.id} className="flex items-center gap-4">
            <ThemeSwatch theme={s.theme} className="h-14 w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">
                {s.name}
                {s.id === data.activeSeasonId && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">live now</span>}
              </h3>
              <p className="text-sm text-stone-500">
                {formatMonthDay(s.startDate)} – {formatMonthDay(s.endDate)}
              </p>
            </div>
            <Toggle checked={s.isActive} onChange={(v) => setActive(s, v)} label={`${s.name} enabled`} />
            {previewButton(`season-${s.id}`, s.name, s.theme)}
            <Link to={`/admin/themes/${s.id}`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
