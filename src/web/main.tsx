import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
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

const router = createBrowserRouter([
  { path: "/", element: <Menu /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Items /> },
      { path: "items/new", element: <ItemForm /> },
      { path: "items/:id", element: <ItemForm /> },
      { path: "categories", element: <Categories /> },
      { path: "themes", element: <Themes /> },
      { path: "themes/:id", element: <ThemeEditor /> },
      { path: "settings", element: <Settings /> },
      { path: "qr", element: <Qr /> },
    ],
  },
  { path: "*", element: <Menu /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
