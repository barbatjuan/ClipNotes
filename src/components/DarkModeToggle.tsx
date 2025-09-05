"use client";
import React, { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

const STORAGE_KEY = "cn-theme";

const DarkModeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  // Inicializa desde localStorage o preferencia del sistema
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : prefersDark;

    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);

    // Mantener sincronía si cambia la preferencia del sistema y el usuario no ha escogido manualmente
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const next = e.matches;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
      }
    };
    mql.addEventListener?.("change", handleChange);
    return () => mql.removeEventListener?.("change", handleChange);
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <button
      onClick={toggleDark}
      aria-label="Cambiar modo oscuro/claro"
      role="switch"
      aria-checked={isDark}
      className="group inline-flex items-center gap-3 select-none"
    >
      <span className="hidden sm:block text-xs font-medium text-secondary-600 dark:text-secondary-300">
        {isDark ? "Modo oscuro" : "Modo claro"}
      </span>
      {/* Track */}
      <span
        className="relative h-8 w-14 rounded-full transition-all duration-300 border backdrop-blur-sm
        border-secondary-300/70 bg-secondary-100/80 shadow-soft-sm
        dark:border-secondary-700/70 dark:bg-secondary-900/60 dark:shadow-soft"
      >
        {/* Glow ring when active */}
        <span className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow dark:shadow-glow-lg" />
        {/* Knob */}
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full grid place-items-center text-white transition-all duration-300
          shadow-soft-md
          ${isDark ? "translate-x-6 bg-gradient-to-b from-secondary-700 to-secondary-800" : "translate-x-0 bg-gradient-to-b from-secondary-500 to-secondary-600"}`}
        >
          {isDark ? (
            <MoonIcon className="h-4 w-4" />
          ) : (
            <SunIcon className="h-4 w-4" />
          )}
        </span>
      </span>
    </button>
  );
};

export default DarkModeToggle;