import type { LayoutKey } from "../../shared/theme";

/** Small pictogram of an item layout, optionally followed by its name. */
export function LayoutIcon({ layout, label }: { layout: LayoutKey; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        {layout === "rows" && (
          <>
            <rect x="1" y="2" width="9" height="2" rx="1" />
            <rect x="12" y="1.5" width="3" height="3" rx="0.8" />
            <rect x="1" y="7" width="9" height="2" rx="1" />
            <rect x="12" y="6.5" width="3" height="3" rx="0.8" />
            <rect x="1" y="12" width="9" height="2" rx="1" />
            <rect x="12" y="11.5" width="3" height="3" rx="0.8" />
          </>
        )}
        {layout === "grid" && (
          <>
            <rect x="1" y="1" width="6" height="6" rx="1.5" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" />
          </>
        )}
        {layout === "column" && (
          <>
            <rect x="2" y="1" width="12" height="8" rx="1.5" />
            <rect x="2" y="11" width="9" height="1.8" rx="0.9" />
            <rect x="2" y="14" width="6" height="1.5" rx="0.75" />
          </>
        )}
      </svg>
      {label}
    </span>
  );
}
