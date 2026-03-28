"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/timeline", label: "Timeline" },
  { href: "/quality", label: "Quality" },
  { href: "/features", label: "Features" },
  { href: "/tokens", label: "Tokens" },
  { href: "/git", label: "Git" },
];

const THEME_STORAGE_KEY = "agentforge-theme";

type Theme = "light" | "dark";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("dark");
  const [hasHydratedTheme, setHasHydratedTheme] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      setHasHydratedTheme(true);
      return;
    }

    setTheme(prefersDark ? "dark" : "light");
    setHasHydratedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedTheme) {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, hasHydratedTheme]);

  const isDark = theme === "dark";
  const nextTheme: Theme = isDark ? "light" : "dark";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100 md:flex">
      <aside className="border-b border-zinc-200 bg-zinc-50/90 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60 md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <nav className="p-4 md:p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            Navigation
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 transition-colors dark:border-zinc-800 md:px-8">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            AgentForge
          </h1>
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label={`Switch to ${nextTheme} mode`}
          >
            {isDark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
