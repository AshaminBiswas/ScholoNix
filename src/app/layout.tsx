import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/config/site";
import { ConsoleCleaner } from "@/components/ui/console-cleaner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-config";
import { AppImageKitProvider } from "@/components/media/imagekit-provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} light`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased bg-[var(--bg-main)] text-[var(--text-body)] transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window!=='undefined'){window.console.log=function(){};window.console.info=function(){};window.console.debug=function(){};var w=window.console.warn;window.console.warn=function(){var m=arguments[0];if(typeof m==='string'&&(m.indexOf('Fast Refresh')!==-1||m.indexOf('React DevTools')!==-1||m.indexOf('Image with src')!==-1)){return;}w.apply(window.console,arguments);};}})();`,
          }}
        />
        <ConsoleCleaner />
        <ThemeProvider>
          <AppImageKitProvider>{children}</AppImageKitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
