import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Script from "next/script";

export const metadata: Metadata = {
  title: "AgentForge",
  description: "Self-referential metrics dashboard",
};

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("agentforge-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
