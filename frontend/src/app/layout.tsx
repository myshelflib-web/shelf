import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
// Root app shell fonts + providers
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import { resolveGoogleClientId } from "@/lib/publicConfig";
import { HotkeysProvider } from "@/hooks/useHotkeys";
import { AppHotkeys } from "@/components/AppHotkeys";
import { PwaInstallHint } from "@/components/PwaInstallHint";
import { PwaRegister } from "@/components/PwaRegister";
import { OfflineSyncProvider } from "@/components/OfflineSyncProvider";
import { OfflineNotice } from "@/components/OfflineNotice";
import { CompactPortraitSync } from "@/components/CompactPortraitSync";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shelf — Your study library",
    template: "%s · Shelf",
  },
  description:
    "Free exam curriculum (UPSC syllabus, NCERT, and more) plus a personal study library. Read publicly; sign in for collections, highlights, and Study AI.",
  applicationName: "Shelf",
  appleWebApp: {
    capable: true,
    title: "Shelf",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = resolveGoogleClientId();

  return (
    <html lang="en" className={`dark h-full ${sans.variable} ${serif.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <GoogleAuthProvider clientId={googleClientId}>
            <AuthProvider>
              <HotkeysProvider>
                <PwaRegister />
                <CompactPortraitSync />
                <OfflineSyncProvider />
                <OfflineNotice />
                <AppHotkeys />
                {children}
                <PwaInstallHint />
              </HotkeysProvider>
            </AuthProvider>
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
