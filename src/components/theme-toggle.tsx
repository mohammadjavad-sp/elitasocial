"use client";

import { Icon } from "./icons";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const description = theme === "dark" ? "تغییر به حالت روشن" : "تغییر به حالت تاریک";
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="حالت تاریک" aria-pressed={theme === "dark"} title={description}>
    <span className="theme-toggle-moon"><Icon name="moon" /></span>
    <span className="theme-toggle-sun"><Icon name="sun" /></span>
  </button>;
}
