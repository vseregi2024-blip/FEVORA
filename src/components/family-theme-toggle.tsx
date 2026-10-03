"use client";

import { useEffect, useSyncExternalStore } from "react";

export type FamilyTheme = "dark" | "light" | "system";

const storageKey = "fevora-family-theme";
const themeEvent = "fevora-family-theme-change";

const currentTheme = (): FamilyTheme => {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "light" || stored === "system" ? stored : "dark";
};
const resolvedTheme = (theme: FamilyTheme) => theme === "system" ? window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark" : theme;
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(themeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(themeEvent, listener);
  };
};

export function applyFamilyTheme(theme: FamilyTheme) {
  document.documentElement.dataset.familyTheme = resolvedTheme(theme);
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new Event(themeEvent));
}

export function useFamilyTheme() {
  const theme = useSyncExternalStore<FamilyTheme>(subscribe, currentTheme, () => "dark");
  useEffect(() => {
    document.documentElement.dataset.familyTheme = resolvedTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => { document.documentElement.dataset.familyTheme = media.matches ? "light" : "dark"; };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  return { theme, selectTheme: applyFamilyTheme };
}

export function FamilyThemeToggle() {
  const { theme, selectTheme } = useFamilyTheme();
  return <div className="imperia-theme-options" role="group" aria-label="Выберите тему"><button type="button" className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => selectTheme("light")}><span className="theme-symbol">☀</span><span>Светлая</span></button><button type="button" className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => selectTheme("dark")}><span className="theme-symbol">◒</span><span>Тёмная</span></button><button type="button" className={theme === "system" ? "active" : ""} aria-pressed={theme === "system"} onClick={() => selectTheme("system")}><span className="theme-symbol">✦</span><span>Система</span></button></div>;
}
