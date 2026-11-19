import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { copy } from "@/lib/copy";
import "./globals.css";

// Self-hosted (OFL, see fonts/OFL.txt) so builds don't depend on reaching Google Fonts.
const jakarta = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/PlusJakartaSans-regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/PlusJakartaSans-medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/PlusJakartaSans-semibold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/PlusJakartaSans-bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/PlusJakartaSans-extrabold.ttf", weight: "800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: { default: copy.appName, template: `%s · ${copy.appName}` },
  description: "Plan every task for your move into a new home.",
  applicationName: copy.appName,
};

export const viewport: Viewport = {
  // Mirrors --primary in globals.css (browser chrome colour cannot read CSS variables).
  themeColor: "#0e6b62",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
