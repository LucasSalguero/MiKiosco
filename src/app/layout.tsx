import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./components.css";

import { SincronizadorAutomatico } from "@/features/offline-sync/ui/SincronizadorAutomatico";
import { RegistrarServiceWorker } from "@/features/offline-sync/ui/RegistrarServiceWorker";
import { NavegacionPrincipal } from "@/shared/ui/NavegacionPrincipal";
import { ToastProvider } from "@/shared/ui/ToastProvider";

export const metadata: Metadata = {
  title: "Mi Kiosco",
  description: "Gestion de ventas y productos del kiosco",
  appleWebApp: { capable: true, title: "Mi Kiosco", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
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
          <RegistrarServiceWorker />
          <SincronizadorAutomatico />
          <NavegacionPrincipal />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
