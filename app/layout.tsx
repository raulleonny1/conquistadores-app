import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PwaRegister from "@/src/components/PwaRegister";
import BarraLegalGlobal from "@/src/components/legal/BarraLegalGlobal";
import FirebaseSessionInit from "@/src/components/FirebaseSessionInit";
import { PWA_THEME_COLOR } from "@/src/constants/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConquistadoresApp — Ministerio Joven",
  description:
    "Plataforma independiente (no oficial IASD) para clubes de Conquistadores, Aventureros y Jóvenes Adventistas",
  applicationName: "ConquistadoresApp",
  appleWebApp: {
    capable: true,
    title: "ConquistadoresApp",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC] min-h-screen flex flex-col`}
      >
        <FirebaseSessionInit />
        <BarraLegalGlobal />
        {children}
        <PwaRegister />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
