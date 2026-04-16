import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoyaMoya Companion",
  description: "Pratite simptome, lijekove i zdravstveno stanje - aplikacija za pacijente s moyamoya bolešću",
  keywords: "moyamoya, zdravlje, simptomi, lijekovi, krvni tlak, cerebrovaskularna bolest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body className="antialiased bg-neutral-50 text-neutral-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
