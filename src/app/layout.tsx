import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class of 2006 · 20th Alumni Reunion 2026",
  description: "Välj vilka du vill sitta med.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
