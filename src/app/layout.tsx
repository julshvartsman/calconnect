import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "CalConnect — Berkeley Student Resources",
  description:
    "Search once, get everything: hours, eligibility, what to bring, and direct links. No page-hopping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
