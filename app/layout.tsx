import type { Metadata, Viewport } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import "./globals.css";

// next/font self-hosts both families in out/, so type renders offline too.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Nomad", template: "%s · Nomad" },
  description: "Guitar theory decoders, on the go.",
  applicationName: "Nomad",
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
      <body className="bg-bg font-sans text-text-primary antialiased">{children}</body>
    </html>
  );
}
