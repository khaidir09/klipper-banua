"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Applies the `.dark` class that `app/globals.css` styles against. Without it
 * the dark palette is dead code, and `components/ui/sonner.tsx` — which reads
 * `useTheme()` — always falls back to its default instead of following the
 * chosen theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
