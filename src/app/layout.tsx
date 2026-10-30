import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIRVAXIS — Bilateral Friction & Resolution Engine | Nebius × NVIDIA 2026",
  description:
    "World-first bilateral AI engine for administrative friction. One dispute. Two deliverables. Code-verified citizen appeal kit + zero-PII root-cause diagnostic packet for institutions. Built on Nemotron Nano 30B, Super 120B, Ultra 550B & Tavily.",
  icons: {
    icon: "/pentagon-emblem.png",
    shortcut: "/pentagon-emblem.png",
    apple: "/pentagon-emblem.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[#05070d] text-slate-200 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}
