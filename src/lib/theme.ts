export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "elita-theme";
export const THEME_COLORS: Record<Theme, string> = { light: "#fff9fd", dark: "#18131f" };

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  let color = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!color) {
    color = document.createElement("meta");
    color.name = "theme-color";
    document.head.append(color);
  }
  color.content = THEME_COLORS[theme];
}

// Run before the body paints so a saved preference never flashes the other theme.
// Storage and media queries may be unavailable in private or restricted browsers.
export const themeBootstrapScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){try{t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){t="light"}}var h=document.documentElement;h.dataset.theme=t;h.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}m.content=t==="dark"?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)}})();`;
