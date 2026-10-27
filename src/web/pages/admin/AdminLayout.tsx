import { NavLink, Outlet } from "react-router";
import { useFetch } from "../../lib/useFetch";
import { PreviewProvider, usePreview } from "../../components/preview/PreviewContext";
import { PreviewPanel, PreviewToggle } from "../../components/preview/PreviewPanel";

const links = [
  { to: "/admin", label: "Items", end: true },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/themes", label: "Themes" },
  { to: "/admin/media", label: "Media" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/qr", label: "QR code" },
];

export default function AdminLayout() {
  return (
    <PreviewProvider>
      <Shell />
    </PreviewProvider>
  );
}

function Shell() {
  const { data: me } = useFetch<{ email: string }>("/api/admin/me");
  const { open } = usePreview();
  // Widen the page when the preview is docked beside it.
  const width = open ? "lg:max-w-[88rem]" : "";

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="no-print sticky top-0 z-20 border-b border-stone-200 bg-white">
        <div className={`mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 ${width}`}>
          <span className="font-bold">Menu backoffice</span>
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-stone-500">
            <PreviewToggle />
            <a href="/" target="_blank" className="hover:text-stone-900">
              View menu ↗
            </a>
            {me?.email && <span className="hidden xl:inline">{me.email}</span>}
          </div>
        </div>
      </header>
      <div className={`mx-auto flex max-w-5xl gap-6 px-4 py-6 ${width}`}>
        <main className="min-w-0 flex-1">
          {/* Same centred width on every tab. */}
          <div className="mx-auto w-full max-w-3xl">
            <Outlet />
          </div>
        </main>
        <PreviewPanel />
      </div>
    </div>
  );
}
