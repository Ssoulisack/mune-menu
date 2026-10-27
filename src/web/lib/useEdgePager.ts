import { useEffect, useRef, useState, type RefObject } from "react";

export type PageDirection = "next" | "prev";
export interface Pull {
  dir: PageDirection;
  progress: number; // 0..1
}

const WHEEL_DISTANCE = 260; // px of extra wheel scrolling past the edge
const TOUCH_DISTANCE = 110; // px of finger travel past the edge
const COOLDOWN_MS = 700;
const SETTLE_MS = 180; // wheel must pause at the edge before pulling counts (lets momentum die out)

interface Options {
  /** Element that scrolls; null means the window. */
  scrollerRef: RefObject<HTMLElement | null> | null;
  enabled: boolean;
  canNext: boolean;
  canPrev: boolean;
  onPage: (dir: PageDirection) => void;
}

/**
 * "Keep scrolling past the end to go on": detects an extra pull beyond the bottom (next)
 * or the top (previous) of the scroller, with wheel/trackpad and touch.
 */
export function useEdgePager({ scrollerRef, enabled, canNext, canPrev, onPage }: Options): Pull | null {
  const [pull, setPull] = useState<Pull | null>(null);
  const opts = useRef({ enabled, canNext, canPrev, onPage });
  opts.current = { enabled, canNext, canPrev, onPage };

  useEffect(() => {
    const el = scrollerRef?.current ?? null;
    const target: HTMLElement | Window = el ?? window;

    const edges = () => {
      const top = el ? el.scrollTop : window.scrollY;
      const height = el ? el.clientHeight : window.innerHeight;
      const total = el ? el.scrollHeight : document.documentElement.scrollHeight;
      return { atTop: top <= 1, atBottom: top + height >= total - 2 };
    };

    let cooldownUntil = 0;
    let wheel = { dir: null as PageDirection | null, amount: 0, armed: false };
    let lastWheel = 0;
    let idleTimer = 0;
    let touch: { y: number; atTop: boolean; atBottom: boolean; progress: number; dir: PageDirection | null } | null = null;

    const allowed = (dir: PageDirection) => opts.current.enabled && (dir === "next" ? opts.current.canNext : opts.current.canPrev);

    const reset = () => {
      wheel = { dir: null, amount: 0, armed: wheel.armed };
      setPull(null);
    };

    const fire = (dir: PageDirection) => {
      cooldownUntil = performance.now() + COOLDOWN_MS;
      wheel = { dir: null, amount: 0, armed: false };
      touch = null;
      setPull(null);
      opts.current.onPage(dir);
    };

    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (now < cooldownUntil || e.deltaY === 0) return;

      const { atTop, atBottom } = edges();
      const dir: PageDirection | null = e.deltaY > 0 && atBottom ? "next" : e.deltaY < 0 && atTop ? "prev" : null;
      if (!dir || !allowed(dir)) {
        wheel.armed = false;
        if (wheel.dir) reset();
        return;
      }
      // Arrive at the edge, pause, then scroll again: only then does pulling count.
      if (!wheel.armed) {
        if (gap < SETTLE_MS) return;
        wheel.armed = true;
      }
      if (wheel.dir !== dir) wheel = { dir, amount: 0, armed: true };
      wheel.amount += Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1);
      const progress = Math.min(1, wheel.amount / WHEEL_DISTANCE);
      if (progress >= 1) return fire(dir);
      setPull({ dir, progress });
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(reset, 450);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || performance.now() < cooldownUntil) return;
      touch = { y: e.touches[0].clientY, ...edges(), progress: 0, dir: null };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const dy = touch.y - e.touches[0].clientY; // > 0: finger moves up (scrolling down)
      const dir: PageDirection | null = dy > 0 && touch.atBottom ? "next" : dy < 0 && touch.atTop ? "prev" : null;
      if (!dir || !allowed(dir)) {
        if (touch.dir) setPull(null);
        touch.dir = null;
        touch.progress = 0;
        return;
      }
      touch.dir = dir;
      touch.progress = Math.min(1, Math.abs(dy) / TOUCH_DISTANCE);
      setPull({ dir, progress: touch.progress });
    };

    const onTouchEnd = () => {
      if (touch?.dir && touch.progress >= 1) fire(touch.dir);
      else if (touch?.dir) setPull(null);
      touch = null;
    };

    target.addEventListener("wheel", onWheel as EventListener, { passive: true });
    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    target.addEventListener("touchend", onTouchEnd);
    target.addEventListener("touchcancel", onTouchEnd);
    return () => {
      clearTimeout(idleTimer);
      target.removeEventListener("wheel", onWheel as EventListener);
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      target.removeEventListener("touchend", onTouchEnd);
      target.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [scrollerRef]);

  return enabled ? pull : null;
}
