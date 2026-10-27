import { DECORATIONS, type MenuTheme } from "../../shared/theme";

export function ThemeSwatch({ theme, className = "" }: { theme: MenuTheme; className?: string }) {
  const header = theme.headerStyle === "solid" ? theme.primary : `linear-gradient(135deg, ${theme.primary}, ${theme.headerColor2})`;
  return (
    <div className={`relative overflow-hidden rounded-lg ring-1 ring-black/10 ${className}`} style={{ background: theme.background }}>
      <div className="h-1/2" style={{ background: header }} />
      <div className="absolute inset-x-2 bottom-1.5 h-1/4 rounded" style={{ background: theme.surface }} />
      <span className="absolute right-1 top-0.5 text-xs">{DECORATIONS[theme.decoration].symbols[0] ?? ""}</span>
    </div>
  );
}
