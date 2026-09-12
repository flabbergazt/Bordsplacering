import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

/* Geometric and round, close to the Century Gothic-like face on sasse.se. */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Class of 2006 · 20th Alumni Reunion 2026",
  description: "Välj vilka du vill sitta med.",
};

export const viewport: Viewport = {
  themeColor: "#4b1b54",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
