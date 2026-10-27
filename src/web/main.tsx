import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, data, RouterProvider } from "react-router";
import "./index.css";
import Menu from "./pages/Menu";
import AdminLayout from "./pages/admin/AdminLayout";
import Items from "./pages/admin/Items";
import ItemForm from "./pages/admin/ItemForm";
import Categories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import Qr from "./pages/admin/Qr";
import Themes from "./pages/admin/Themes";
import ThemeEditor from "./pages/admin/ThemeEditor";
import Media from "./pages/admin/Media";
import { AdminErrorPage, MenuErrorPage } from "./pages/ErrorPage";

const router = createBrowserRouter([
  { path: "/", element: <Menu />, errorElement: <MenuErrorPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    errorElement: <AdminErrorPage />,
    children: [
      {
        // Errors in a page show inside the layout, so the backoffice navigation keeps working.
        errorElement: <AdminErrorPage inLayout />,
        children: [
          { index: true, element: <Items /> },
          { path: "items/new", element: <ItemForm /> },
          { path: "items/:id", element: <ItemForm /> },
          { path: "categories", element: <Categories /> },
          { path: "themes", element: <Themes /> },
          { path: "themes/:id", element: <ThemeEditor /> },
          { path: "media", element: <Media /> },
          { path: "settings", element: <Settings /> },
          { path: "qr", element: <Qr /> },
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
