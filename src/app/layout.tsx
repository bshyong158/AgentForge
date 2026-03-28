import type { Metadata } from "next";
import { SidebarNav } from "../components/SidebarNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentForge",
  description: "Self-referential metrics dashboard",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col md:flex-row">
          <aside className="border-b border-zinc-800 md:w-64 md:border-b-0 md:border-r">
            <div className="px-4 py-4 md:px-6 md:py-6">
              <h1 className="text-xl font-semibold tracking-tight">AgentForge</h1>
            </div>
            <SidebarNav />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-zinc-800 px-4 py-4 md:px-6">
              <p className="text-sm text-zinc-300">Self-referential metrics dashboard</p>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
