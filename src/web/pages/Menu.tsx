import { useEffect, useState } from "react";
import type { PublicMenu } from "../../shared/types";
import { UI_STRINGS, type LangCode } from "../../shared/i18n";
import { MenuView } from "../components/MenuView";
import { pickInitialLanguage, saveLanguage } from "../lib/language";
import { useFetch } from "../lib/useFetch";

export default function Menu() {
  const { data: menu, error, loading } = useFetch<PublicMenu>("/api/public/menu");
  const [lang, setLang] = useState<LangCode | null>(null);

  useEffect(() => {
    if (menu && !lang) setLang(pickInitialLanguage(menu.settings.languages, menu.settings.defaultLanguage));
  }, [menu, lang]);

  useEffect(() => {
    if (!menu) return;
    document.title = menu.settings.restaurantName;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", menu.theme.primary);
  }, [menu]);

  useEffect(() => {
    if (lang) document.documentElement.lang = lang;
  }, [lang]);

  // Pulling down at the top goes to the previous category, so turn off Chrome's pull-to-refresh here.
  useEffect(() => {
    const html = document.documentElement;
    html.style.overscrollBehaviorY = "contain";
    return () => {
      html.style.overscrollBehaviorY = "";
    };
  }, []);

  if (loading) return <MenuSkeleton />;
  if (error || !menu) {
    const ui = UI_STRINGS[pickInitialLanguage(["lo", "en"], "lo")];
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center text-stone-600">
        <div>
          <p className="text-lg font-medium">{ui.loadError}</p>
          <button className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-white" onClick={() => location.reload()}>
            {ui.retry}
          </button>
        </div>
      </div>
    );
  }
  if (!lang) return null;

  return (
    <MenuView
      menu={menu}
      theme={menu.theme}
      lang={lang}
      onLangChange={(l) => {
        setLang(l);
        saveLanguage(l);
      }}
    />
  );
}

function MenuSkeleton() {
  return (
    <div className="min-h-dvh animate-pulse bg-stone-50">
      <div className="h-36 bg-stone-300" />
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-stone-200" />
        ))}
      </div>
    </div>
  );
}
