import { useEffect, useState, type ReactNode } from "react";

// iPhone-style device mockup (6.1" proportions, 393×852 pt) for the live preview.
// The status bar takes the menu's theme colour, like Safari does with <meta name="theme-color">.
export function PhoneFrame({ statusBarColor, children }: { statusBarColor: string; children: ReactNode }) {
  return (
    <div
      className="relative mx-auto aspect-[393/852] max-w-full"
      // Height drives the size; width follows from the aspect ratio. Capped so it fits the 380px panel.
      style={{ height: "min(100%, 800px)" }}
    >
      {/* Side buttons: action + volume on the left, power on the right */}
      <span aria-hidden className="absolute -left-[3px] top-[17%] h-[3.5%] w-[3px] rounded-l bg-stone-600" />
      <span aria-hidden className="absolute -left-[3px] top-[24%] h-[7%] w-[3px] rounded-l bg-stone-600" />
      <span aria-hidden className="absolute -left-[3px] top-[33%] h-[7%] w-[3px] rounded-l bg-stone-600" />
      <span aria-hidden className="absolute -right-[3px] top-[27%] h-[11%] w-[3px] rounded-r bg-stone-600" />

      {/* Titanium band + black bezel */}
      <div className="absolute inset-0 rounded-[3.25rem] bg-gradient-to-br from-stone-500 via-stone-700 to-stone-500 p-[3px] shadow-2xl">
        <div className="h-full w-full rounded-[3.1rem] bg-black p-[9px]">
          {/* Screen */}
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.6rem] bg-white">
            <StatusBar color={statusBarColor} />
            <div className="min-h-0 flex-1">{children}</div>
            {/* Home indicator */}
            <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[36%] -translate-x-1/2 rounded-full bg-black/70 mix-blend-difference" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ color }: { color: string }) {
  const time = useClock();
  return (
    <div aria-hidden className="relative z-40 flex h-[46px] shrink-0 items-center justify-between px-7 pt-1 text-white" style={{ background: color }}>
      <span className="w-12 text-[15px] font-semibold tracking-tight">{time}</span>
      {/* Dynamic Island */}
      <span className="absolute left-1/2 top-[11px] h-[26px] w-[31%] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex w-12 items-center justify-end gap-1">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.8" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 2.2c2.1 0 4 .8 5.5 2.1l1.1-1.1A9.4 9.4 0 0 0 7.5.6 9.4 9.4 0 0 0 .9 3.2L2 4.3a7.8 7.8 0 0 1 5.5-2.1Zm0 3.2c1.2 0 2.4.5 3.3 1.3l1.1-1.1a6.3 6.3 0 0 0-8.8 0l1.1 1.1c.9-.8 2.1-1.3 3.3-1.3Zm0 3.2c.4 0 .8.2 1.1.5L7.5 10.2 6.4 9.1c.3-.3.7-.5 1.1-.5Z" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

function useClock() {
  const format = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false });
  const [time, setTime] = useState(format);
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(id);
  }, []);
  return time;
}
