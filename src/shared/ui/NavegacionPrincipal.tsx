"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

const destinos = [
  { href: "/", etiqueta: "Vender" },
  { href: "/historial", etiqueta: "Historial" },
  { href: "/productos", etiqueta: "Productos" },
];

export function NavegacionPrincipal(): ReactElement {
  const pathname = usePathname();

  return (
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
    </nav>
  );
}
