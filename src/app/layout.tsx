import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./components.css";

import { crearVenta } from "@/features/sales/actions/crear-venta";
import { SincronizadorAutomatico } from "@/features/offline-sync/ui/SincronizadorAutomatico";
import { ResumenDiarioProvider } from "@/features/daily-summary/ui/ResumenDiarioProvider";
import { RegistrarServiceWorker } from "@/features/offline-sync/ui/RegistrarServiceWorker";
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
          <ResumenDiarioProvider>
            <RegistrarServiceWorker />
            <SincronizadorAutomatico enviar={crearVenta} />
            {children}
          </ResumenDiarioProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
