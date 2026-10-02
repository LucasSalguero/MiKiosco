"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { hoyISO } from "@/shared/lib/fechas";
import { Boton } from "@/shared/ui/Boton";

export function SelectorDia({ fecha }: { fecha: string }): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hoy = hoyISO();

  const cambiarFecha = (nuevaFecha: string) => {
    if (!nuevaFecha || nuevaFecha > hoy) return;
    const parametros = new URLSearchParams(searchParams.toString());
    parametros.set("fecha", nuevaFecha);
    router.push(`${pathname}?${parametros.toString()}`);
  };

  return (
    <div className="selector-dia">
      <input
        type="date"
        value={fecha}
        max={hoy}
        aria-label="Elegir fecha del historial"
        onChange={(event) => cambiarFecha(event.target.value)}
        className="selector-dia__entrada"
      />
      <Boton variant="secundario" onClick={() => cambiarFecha(hoy)}>
        Hoy
      </Boton>
    </div>
  );
}
