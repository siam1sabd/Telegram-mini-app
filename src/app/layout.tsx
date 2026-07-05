import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Content Vault — Telegram Mini App",
  description:
    "Premium content downloads inside Telegram with points, referrals, and ads-supported access.",
  applicationName: "Content Vault",
  keywords: ["telegram", "mini app", "content", "downloads", "adsgram"],
  authors: [{ name: "Content Vault" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Content Vault",
    description: "Premium content downloads inside Telegram",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F0F12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Telegram WebApp SDK preconnect */}
        <link rel="preconnect" href="https://telegram.org" />
        {/* AdsGram preconnect */}
        <link rel="preconnect" href="https://sad.adsgram.ai" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-[var(--m3-background)] text-[var(--m3-on-background)]`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" />
      </body>
    </html>
  );
}
