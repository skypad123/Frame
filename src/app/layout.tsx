import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Syne } from "next/font/google";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Frame — Yu-Gi-Oh! OCG Japanese Price Lookup",
  description:
    "Progressive web app for brick-and-mortar shops to look up going prices for Yu-Gi-Oh! OCG Japanese cards.",
  applicationName: "Frame",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frame",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1F33",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${noto.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="app-shell">
          {children}
          <InstallPrompt />
          <footer className="site-footer">
            Prices sourced from Bigweb Japanese market listings. Card data via
            YGOPRODeck / YGOrganization. Not affiliated with Konami.
          </footer>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
