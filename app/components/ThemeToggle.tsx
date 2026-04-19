"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    const applyTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
            localStorage.setItem("theme", "dark");
            return;
        }

        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.setItem("theme", "light");
    };

    useEffect(() => {
        // Check for saved user preference or system preference.
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark);
        setIsDark(shouldUseDark);
        if (savedTheme === null) {
            // Persist the initial choice to avoid inconsistent behavior between pages.
            localStorage.setItem("theme", shouldUseDark ? "dark" : "light");
        }
        document.documentElement.classList.toggle("dark", shouldUseDark);
        document.documentElement.classList.toggle("light", !shouldUseDark);

        const syncThemeFromStorage = (event: StorageEvent) => {
            if (event.key !== "theme") return;
            const nextIsDark = event.newValue === "dark";
            setIsDark(nextIsDark);
            document.documentElement.classList.toggle("dark", nextIsDark);
            document.documentElement.classList.toggle("light", !nextIsDark);
        };

        window.addEventListener("storage", syncThemeFromStorage);
        return () => {
            window.removeEventListener("storage", syncThemeFromStorage);
        };
    }, []);

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev;
            applyTheme(next);
            return next;
        });
    };

    return (
        <button
            onClick={toggleTheme}
            className={`relative inline-flex h-12 w-28 items-center rounded-full p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffa000] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111] ${
                isDark
                    ? "bg-[#1f2025] border border-[#2b2d33] shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
                    : "bg-[#e8e8e8] border border-[#d4d4d4] shadow-inner"
            }`}
            title={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
            aria-label={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
            aria-pressed={isDark}
        >
            <span className={`pointer-events-none absolute flex items-center justify-center transition-all duration-300 ${isDark ? "right-5" : "left-5"}`}>
                {isDark ? (
                    <Moon size={18} className="text-[#f0f1f3]" />
                ) : (
                    <Sun size={18} className="text-[#111111]" />
                )}
            </span>

            <span
                className={`relative z-10 inline-flex h-10 w-10 transform items-center justify-center rounded-full transition-transform duration-300 ease-out ${
                    isDark
                        ? "translate-x-0 bg-[#f3f3f3] shadow-[inset_0_2px_6px_rgba(255,255,255,0.75),0_3px_8px_rgba(0,0,0,0.25)]"
                        : "translate-x-16 bg-[#2a2b2f] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),0_3px_8px_rgba(0,0,0,0.35)]"
                }`}
            />
        </button>
    );
}
