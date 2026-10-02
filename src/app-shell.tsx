"use client";

import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

import { SincronizadorAutomatico } from "@/features/offline-sync/ui/SincronizadorAutomatico";
import { RegistrarServiceWorker } from "@/features/offline-sync/ui/RegistrarServiceWorker";
import { NavegacionPrincipal } from "@/shared/ui/NavegacionPrincipal";

export function AppShell(): ReactElement | null {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      <RegistrarServiceWorker />
      <SincronizadorAutomatico />
      <NavegacionPrincipal />
    </>
  );
}
