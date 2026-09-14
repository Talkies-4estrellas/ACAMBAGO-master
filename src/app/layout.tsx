import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ThemeProvider from "@/components/ui/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import DemoModeGuard from "@/components/ui/DemoModeGuard";

export const metadata: Metadata = {
  title: "Acom-Di - Revista de Acámbaro",
  description:
    "Descubre productos locales, tiendas y cupones exclusivos en Acámbaro, Guanajuato.",
  keywords: "Acámbaro, Guanajuato, tiendas locales, cupones, marketplace, Acom-Di",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==null&&d))document.documentElement.classList.add('dark');})();`,
            }}
          />
        </head>
        <body suppressHydrationWarning>
          <ThemeProvider>
            <DemoModeGuard />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: "12px", fontSize: "14px" },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
