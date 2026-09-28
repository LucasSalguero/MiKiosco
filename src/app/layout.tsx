import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { crearVenta } from "@/features/sales/actions/crear-venta";
import { SincronizadorAutomatico } from "@/features/offline-sync/ui/SincronizadorAutomatico";
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
          <SincronizadorAutomatico enviar={crearVenta} />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}