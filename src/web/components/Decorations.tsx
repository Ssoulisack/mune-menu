import { useState, type AnimationEvent, type CSSProperties } from "react";
import { DECORATIONS, type DecorationKey } from "../../shared/theme";

const COUNT = 14;

const between = (min: number, max: number) => min + Math.random() * (max - min);

/** A random path for one symbol: where it starts, how it sways and spins on the way down. */
function randomPath(): Record<string, string> {
  return {
    left: `${between(-2, 98)}%`,
    "--sway": `${between(-50, 50)}px`,
    "--drift": `${between(-60, 60)}px`,
    "--spin": `${between(-540, 540)}deg`,
  };
}

// Gently falling seasonal symbols, each on its own random path. Values are picked once per mount
// (so re-renders don't make them jump) and again whenever a symbol starts a new fall off-screen.
export function Decorations({ kind, contained }: { kind: DecorationKey; contained?: boolean }) {
  const symbols = DECORATIONS[kind]?.symbols ?? [];
  const [flakes] = useState(() =>
    Array.from({ length: COUNT }, () => {
      const duration = between(9, 22);
      return {
        pick: Math.random(),
        style: {
          ...randomPath(),
          fontSize: `${between(13, 30)}px`,
          opacity: between(0.55, 0.95),
          animationDuration: `${duration}s`,
          // Negative delay: start somewhere mid-fall so the screen isn't empty at first.
          animationDelay: `-${between(0, duration)}s`,
        } as CSSProperties,
      };
    }),
  );
  if (!symbols.length) return null;

  // The symbol is above the screen when a new loop starts, so a new path doesn't show a jump.
  const onLoop = (e: AnimationEvent<HTMLSpanElement>) => {
    for (const [prop, value] of Object.entries(randomPath())) e.currentTarget.style.setProperty(prop, value);
  };

  return (
    <div aria-hidden className={`m-deco ${contained ? "m-contained absolute" : "fixed"} inset-0`}>
      {flakes.map((flake, i) => (
        <span key={i} style={flake.style} onAnimationIteration={onLoop}>
          {symbols[Math.floor(flake.pick * symbols.length)]}
        </span>
      ))}
    </div>
  );
}
