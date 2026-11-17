"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
type Theme = "light" | "dark";
const storageKey = "lucent-theme";
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f6f3eb" : "#101211");
}
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
    function sync(event: StorageEvent) {
      if (event.key !== storageKey) return;
      const next = event.newValue === "light" ? "light" : "dark";
      applyTheme(next);
      setTheme(next);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const transitioning = useRef(false);
  async function toggle() {
    if (transitioning.current) return;
    const next =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    const update = () => { applyTheme(next); setTheme(next); };
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transitioning.current = true;
      try {
        const transition = document.startViewTransition(() => flushSync(update));
        await transition.finished;
      } finally { transitioning.current = false; }
    } else update();
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Theme switching also works without browser storage. */
    }
  }
  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun className="theme-sun" size={16} aria-hidden="true" />
      <Moon className="theme-moon" size={16} aria-hidden="true" />
    </button>
  );
}
