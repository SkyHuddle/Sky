import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Barlow_Condensed } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Display face for event titles, hero names and big numbers only (DESIGN.md v1.2 §3.2).
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow-condensed", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lockin: CS2 tournament fantasy", template: "%s · Lockin" },
  description: "Build your dream esports team, compete through the biggest CS2 tournaments, and prove you're the best fantasy manager.",
  applicationName: "Lockin",
  // Absolute URLs for share-card previews; set APP_URL in production.
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#0b0c0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
