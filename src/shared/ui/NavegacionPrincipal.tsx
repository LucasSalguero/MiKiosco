"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { cerrarSesion } from "@/features/auth/actions/cerrar-sesion";
import { useToast } from "@/shared/ui/use-toast";

const destinos = [
  { href: "/", etiqueta: "Vender" },
  { href: "/historial", etiqueta: "Historial" },
  { href: "/productos", etiqueta: "Productos" },
];

export function NavegacionPrincipal(): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { mostrar } = useToast();

  const bloquear = async () => {
    try {
      const resultado = await cerrarSesion();
      if (!resultado.ok) {
        mostrar("No se pudo bloquear la aplicación.", "error");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("auth.cerrarSesion", error);
      mostrar("No se pudo bloquear la aplicación.", "error");
    }
  };

  return (
    <>
      <nav className="navegacion-principal" aria-label="Navegación principal">
        {destinos.map((destino) => {
          const activo = pathname === destino.href;
          return (
            <Link
              key={destino.href}
              href={destino.href}
              className={
                activo ? "navegacion-principal__enlace activo" : "navegacion-principal__enlace"
              }
              aria-current={activo ? "page" : undefined}
            >
              {destino.etiqueta}
            </Link>
          );
        })}
        <button type="button" className="navegacion-principal__enlace" onClick={bloquear}>
          Bloquear
        </button>
      </nav>
    </>
  );
}
