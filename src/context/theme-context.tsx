"use client";

import * as React from "react";

export interface ThemePreset {
  id: string;
  label: string;
  shades: Record<number, string>;
}

export const themePresets: ThemePreset[] = [
  {
    id: "ocean",
    label: "Ocean",
    shades: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
  },
  {
    id: "amethyst",
    label: "Amethyst",
    shades: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
      950: "#3b0764",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    shades: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    shades: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
      950: "#431407",
    },
  },
  {
    id: "rose",
    label: "Rose",
    shades: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519",
    },
  },
  {
    id: "teal",
    label: "Teal",
    shades: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6",
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
      950: "#042f2e",
    },
  },
];

const ThemeContext = React.createContext<{
  activeTheme: ThemePreset;
  setTheme: (id: string) => void;
  themes: ThemePreset[];
}>({
  activeTheme: themePresets[0],
  setTheme: () => {},
  themes: themePresets,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState("ocean");

  const activeTheme = React.useMemo(
    () => themePresets.find((t) => t.id === activeId) ?? themePresets[0],
    [activeId],
  );

  React.useEffect(() => {
    const root = document.documentElement;
    for (const [shade, color] of Object.entries(activeTheme.shades)) {
      root.style.setProperty(`--t-${shade}`, color);
    }
  }, [activeTheme]);

  const setTheme = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ activeTheme, setTheme, themes: themePresets }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
