"use client";

import type { ReactElement } from "react";

import { hoyISO } from "@/shared/lib/fechas";
import { Boton } from "@/shared/ui/Boton";

export function SelectorDia({
  fecha,
  onCambiar,
}: {
  fecha: string;
  onCambiar: (fecha: string) => void;
}): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <input
        type="date"
        value={fecha}
        onChange={(event) => onCambiar(event.target.value)}
        className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3"
      />
      <Boton variant="secundario" onClick={() => onCambiar(hoyISO())}>
        Hoy
      </Boton>
    </div>
  );
}
