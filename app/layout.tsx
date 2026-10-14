import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

// Latin-subset variable fonts committed in app/fonts (OFL, licenses alongside).
// Local files, not next/font/google: the build never depends on reaching
// Google Fonts (it failed in CI), and out/ ships them so type renders offline.
const dmSans = localFont({
  src: "./fonts/dm-sans-latin-wght.woff2",
  weight: "100 1000",
  variable: "--font-sans",
  display: "swap",
});
const oswald = localFont({
  src: "./fonts/oswald-latin-wght.woff2",
  weight: "200 700",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Nomad", template: "%s · Nomad" },
  description: "Guitar theory decoders, on the go.",
  applicationName: "Nomad",
  appleWebApp: { capable: true, title: "Nomad", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the app draw under the notch/home indicator; the shell pads with
  // env(safe-area-inset-*) so content stays clear of them.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#121418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${oswald.variable}`}>
      <body className="bg-bg font-sans text-text-primary antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
