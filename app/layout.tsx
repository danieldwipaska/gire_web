import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell, { AppSession } from "./components/layout/AppShell";
import { DetailDrawerProvider } from "./components/drawer/DetailDrawerProvider";
import { getSession } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiRe - Engineer Command Center",
  description:
    "Unified workspace for GitHub PRs, Issues, Reviews, Projects, and Technical Notes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getSession()) as AppSession | null;
  const workspaceCtx = session?.id
    ? await getWorkspaceContext(session.id)
    : null;

  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-[#0b0f19] text-slate-100 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        <DetailDrawerProvider>
          <AppShell
            session={session}
            isSuperUser={workspaceCtx?.isSuperUser ?? false}
            workspaces={workspaceCtx?.workspaces ?? []}
            activeWorkspace={workspaceCtx?.activeWorkspace ?? null}
          >
            {children}
          </AppShell>
        </DetailDrawerProvider>
      </body>
    </html>
  );
}
