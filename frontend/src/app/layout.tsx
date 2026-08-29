import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
// Root app shell fonts + providers
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import { TelegramAuthProvider } from "@/components/TelegramAuthProvider";
import {
  resolveGoogleClientId,
  resolveTelegramBotUsername,
} from "@/lib/publicConfig";
import { FocusMediaProvider } from "@/hooks/useFocusMedia";
import { HotkeysProvider } from "@/hooks/useHotkeys";
import { AppDialogProvider } from "@/hooks/useAppDialog";
import { AppHotkeys } from "@/components/AppHotkeys";
import { PwaInstallHint } from "@/components/PwaInstallHint";
import { PwaRegister } from "@/components/PwaRegister";
import { OfflineSyncProvider } from "@/components/OfflineSyncProvider";
import { OfflineNotice } from "@/components/OfflineNotice";
import { CompactPortraitSync } from "@/components/CompactPortraitSync";
import { rootLayoutMetadata } from "@/lib/seo/metadata";

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

export const metadata: Metadata = rootLayoutMetadata();

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
  const telegramBotUsername = resolveTelegramBotUsername();

  return (
    <html lang="en-IN" className={`dark h-full ${sans.variable} ${serif.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <GoogleAuthProvider clientId={googleClientId}>
            <TelegramAuthProvider botUsername={telegramBotUsername}>
              <AuthProvider>
                <HotkeysProvider>
                  <FocusMediaProvider>
                  <AppDialogProvider>
                    <PwaRegister />
                    <CompactPortraitSync />
                    <OfflineSyncProvider />
                    <OfflineNotice />
                    <AppHotkeys />
                    {children}
                    <PwaInstallHint />
                  </AppDialogProvider>
                  </FocusMediaProvider>
                </HotkeysProvider>
              </AuthProvider>
            </TelegramAuthProvider>
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
