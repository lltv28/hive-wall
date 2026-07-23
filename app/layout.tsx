import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  // Append the platform emoji fonts so glyphs like 💰 📅 🔥 in the ad stages
  // resolve to the OS color-emoji face — Apple Color Emoji on macOS — instead of
  // relying on the browser's implicit last-resort fallback. Every demo uses
  // fontFamily:'inherit', so this body-level stack reaches all of them.
  fallback: ["Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "sans-serif"],
});

export const metadata: Metadata = {
  title: "AI Quiz Funnel — Discover Your AI Product Opportunity",
  description: "Assess your AI product readiness. A diagnostic tool by Kodara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={instrumentSans.className}>
        {children}
      </body>
    </html>
  );
}
