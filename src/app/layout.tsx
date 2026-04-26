import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "../components/layout/sidebar";
import Header from "../components/layout/header";
import { getSession } from "../lib/auth";

export const metadata: Metadata = {
  title: "Boutique SaaS",
  description: "Gestion premium de boutique",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="app-shell-bg app-text">
        {session ? (
          <div className="min-h-screen p-5">
            <div className="mx-auto flex max-w-[1600px] gap-5">
              <Sidebar role={session.role} />

              <main className="min-w-0 flex-1 space-y-5">
                <Header userName={session.name} userRole={session.role} />
                {children}
              </main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}