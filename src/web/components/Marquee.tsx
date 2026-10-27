import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const SPEED_PX_PER_S = 45;

/**
 * One line of text. If it doesn't fit, it scrolls sideways in an endless loop (two copies side
 * by side, moved by exactly one copy's width so the loop is seamless); if it fits, it stays put.
 */
export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [loop, setLoop] = useState<{ seconds: number } | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const copy = copyRef.current;
    if (!box || !copy) return;
    // Visitors who prefer less motion get wrapped text instead (see index.css).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const measure = () => {
      // The copy's width includes its trailing gap; the text alone is what has to fit.
      const textWidth = copy.scrollWidth - parseFloat(getComputedStyle(copy).paddingRight || "0");
      const overflows = textWidth > box.clientWidth + 1;
      setLoop(overflows ? { seconds: Math.max(8, copy.scrollWidth / SPEED_PX_PER_S) } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [children]);

  return (
    <span ref={boxRef} className={`m-marquee ${loop ? "m-marquee--loop" : ""} ${className}`}>
      <span className="m-marquee__track" style={loop ? { animationDuration: `${loop.seconds}s` } : undefined}>
        <span ref={copyRef} className="m-marquee__copy">
          {children}
        </span>
        {/* Second copy only while looping; screen readers read the text once. */}
        {loop && (
          <span aria-hidden className="m-marquee__copy">
            {children}
          </span>
        )}
      </span>
    </span>
  );
}
