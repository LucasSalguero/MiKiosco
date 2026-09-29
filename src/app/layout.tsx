import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./components.css";

import { crearVenta } from "@/features/sales/actions/crear-venta";
import { SincronizadorAutomatico } from "@/features/offline-sync/ui/SincronizadorAutomatico";
import { RegistrarServiceWorker } from "@/features/offline-sync/ui/RegistrarServiceWorker";
import { NavegacionPrincipal } from "@/shared/ui/NavegacionPrincipal";
import { ToastProvider } from "@/shared/ui/ToastProvider";

export const metadata: Metadata = {
  title: "Mi Kiosco",
  description: "Gestion de ventas y productos del kiosco",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <RegistrarServiceWorker />
          <SincronizadorAutomatico enviar={crearVenta} />
          <NavegacionPrincipal />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
