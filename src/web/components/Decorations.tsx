import { DECORATIONS, type DecorationKey } from "../../shared/theme";

const COUNT = 14;

// Gently falling seasonal symbols. Positions are deterministic so they don't jump on re-render.
export function Decorations({ kind, contained }: { kind: DecorationKey; contained?: boolean }) {
  const symbols = DECORATIONS[kind]?.symbols ?? [];
  if (!symbols.length) return null;

  return (
    <div aria-hidden className={`m-deco ${contained ? "m-contained absolute" : "fixed"} inset-0`}>
      {Array.from({ length: COUNT }, (_, i) => {
        const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
        return (
          <span
            key={i}
            style={{
              left: `${(i / COUNT) * 100 + r(1) * 6}%`,
              fontSize: `${14 + r(2) * 14}px`,
              animationDuration: `${10 + r(3) * 10}s`,
              animationDelay: `-${r(4) * 20}s`,
            }}
          >
            {symbols[i % symbols.length]}
          </span>
        );
      })}
    </div>
  );
}
