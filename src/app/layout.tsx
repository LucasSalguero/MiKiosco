import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./components.css";

import { AppShell } from "@/app-shell";
import { ToastProvider } from "@/shared/ui/ToastProvider";

export const metadata: Metadata = {
  title: "Mi Kiosco",
  description: "Gestion de ventas y productos del kiosco",
  appleWebApp: { capable: true, title: "Mi Kiosco", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087c59",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <AppShell />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
