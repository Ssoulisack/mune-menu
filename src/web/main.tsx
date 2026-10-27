import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, data, RouterProvider } from "react-router";
import "./index.css";
import Menu from "./pages/Menu";
import { AdminErrorPage, MenuErrorPage } from "./pages/ErrorPage";

// Backoffice pages load on demand, so customers opening the menu don't download them.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

function AdminLoading() {
  return <div className="min-h-dvh bg-stone-100 p-6 text-sm text-stone-500">Loading…</div>;
}

const router = createBrowserRouter([
  { path: "/", element: <Menu />, errorElement: <MenuErrorPage /> },
  {
    path: "/admin",
    lazy: page(() => import("./pages/admin/AdminLayout")),
    hydrateFallbackElement: <AdminLoading />,
    errorElement: <AdminErrorPage />,
    children: [
      {
        // Errors in a page show inside the layout, so the backoffice navigation keeps working.
        errorElement: <AdminErrorPage inLayout />,
        children: [
          { index: true, lazy: page(() => import("./pages/admin/Items")) },
          { path: "items/new", lazy: page(() => import("./pages/admin/ItemForm")) },
          { path: "items/:id", lazy: page(() => import("./pages/admin/ItemForm")) },
          { path: "categories", lazy: page(() => import("./pages/admin/Categories")) },
          { path: "themes", lazy: page(() => import("./pages/admin/Themes")) },
          { path: "themes/:id", lazy: page(() => import("./pages/admin/ThemeEditor")) },
          { path: "media", lazy: page(() => import("./pages/admin/Media")) },
          { path: "settings", lazy: page(() => import("./pages/admin/Settings")) },
          { path: "qr", lazy: page(() => import("./pages/admin/Qr")) },
          // Unknown backoffice URLs show the not-found error inside the layout.
          { path: "*", loader: () => { throw data("Not found", { status: 404 }); } },
        ],
      },
    ],
  },
  { path: "*", element: <Menu />, errorElement: <MenuErrorPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
