import type { Metadata, Viewport } from "next";
import { Assistant, Heebo } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const APP_NAME = "MOM-MANAGER";
const APP_DEFAULT_TITLE = "MOM-MANAGER 5.0";
const APP_TITLE_TEMPLATE = "%s · MOM-MANAGER";
const APP_DESCRIPTION =
  "אפליקציית ניהול יומי למורה, מנהלת אולפן ואמא לארבעה — גרסה 5.0";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
      {
        url: "/icons/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: APP_DEFAULT_TITLE,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#d4e4d4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${heebo.variable} ${assistant.variable} min-h-screen bg-cream-100 font-sans text-slate-900 antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
