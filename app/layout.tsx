import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { appUrl } from "@/lib/app-url";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Canonical and Open Graph URLs on the public site are written relative
  // (PRD M15); this is what they resolve against.
  metadataBase: appUrl("/"),
  title: {
    default: publicEnv.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${publicEnv.NEXT_PUBLIC_APP_NAME}`,
  },
  description: "Aplikasi internal pengelolaan kampanye kreator lokal Kalimantan.",
  // Default for the whole deployment. The public marketing group overrides
  // it with `index: true` (FR-M15-05).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class on <html> before paint, which the server
    // markup cannot know about: suppressHydrationWarning covers that one attribute.
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
