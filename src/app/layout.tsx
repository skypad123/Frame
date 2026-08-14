import type { Metadata, Viewport } from "next";
import { Bitcount_Single, Quicksand } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const bitcount = Bitcount_Single({
  variable: "--font-bitcount",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcadia — Thank You",
  description:
    "Arcadia has been wound down. Thank you to our supporters and the team that contributed. More projects to come.",
  applicationName: "Arcadia",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arcadia",
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
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bitcount.variable} ${quicksand.variable} h-full`}
    >
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
