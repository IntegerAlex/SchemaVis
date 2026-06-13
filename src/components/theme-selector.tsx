"use client";

import * as React from "react";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { activeTheme, setTheme, themes } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
        )}
        title="Change theme"
      >
        <span
          className="size-3 rounded-full ring-2 ring-white/30"
          style={{ backgroundColor: activeTheme.shades[500] }}
        />
        <span className="hidden sm:inline">{activeTheme.label}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "min-w-[160px] p-1.5 rounded-xl",
            "bg-slate-900/95 backdrop-blur-xl border border-white/10",
            "shadow-2xl shadow-black/40",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setTheme(theme.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                theme.id === activeTheme.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className="size-3 rounded-full ring-1 ring-white/20 shrink-0"
                style={{ backgroundColor: theme.shades[500] }}
              />
              {theme.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
