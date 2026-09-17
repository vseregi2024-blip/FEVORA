"use client";

import { useEffect, useSyncExternalStore } from "react";

export type FamilyTheme = "dark" | "light";

const storageKey = "fevora-family-theme";
const themeEvent = "fevora-family-theme-change";

const currentTheme = (): FamilyTheme => window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(themeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(themeEvent, listener);
  };
};

export function applyFamilyTheme(theme: FamilyTheme) {
  document.documentElement.dataset.familyTheme = theme;
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new Event(themeEvent));
}

export function useFamilyTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark");
  useEffect(() => {
    document.documentElement.dataset.familyTheme = theme;
  }, [theme]);
  return { theme, selectTheme: applyFamilyTheme };
}

export function FamilyThemeToggle() {
  const { theme, selectTheme } = useFamilyTheme();
  return <section className="family-theme-card" aria-labelledby="family-theme-title"><div><p className="eyebrow">Оформление</p><h2 id="family-theme-title">Палитра IMPERIA</h2><p>Выбор сохранится на этом устройстве.</p></div><div className="family-theme-options" role="group" aria-label="Выберите палитру"><button type="button" className={theme === "dark" ? "active dark-theme" : "dark-theme"} aria-pressed={theme === "dark"} onClick={() => selectTheme("dark")}><i/><span><b>Тёмная</b><small>Графит и золото</small></span></button><button type="button" className={theme === "light" ? "active light-theme" : "light-theme"} aria-pressed={theme === "light"} onClick={() => selectTheme("light")}><i/><span><b>Светлая</b><small>Жемчуг и сирень</small></span></button></div></section>;
}
