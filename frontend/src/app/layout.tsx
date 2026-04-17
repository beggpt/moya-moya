import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoyaMoya Companion",
  description: "Community and health tracking app for moyamoya disease patients — log symptoms, medications, blood pressure, and connect with others.",
  keywords: "moyamoya, health, symptoms, medications, blood pressure, cerebrovascular disease, community, forum",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MoyaMoya",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MoyaMoya" />
      </head>
      <body className="antialiased bg-neutral-50 text-neutral-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
