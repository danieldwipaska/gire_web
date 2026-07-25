import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { getSession } from "@/lib/auth";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiRe - Github Reporting & Task Automation",
  description: "An elegant app to track developer's Github stats and PRs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-[#0b0f19] text-slate-100 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        <Navbar session={session} />
        {children}
      </body>
    </html>
  );
}
