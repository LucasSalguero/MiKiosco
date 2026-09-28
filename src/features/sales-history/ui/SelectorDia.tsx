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
    <div className="selector-dia">
      <input
        type="date"
        value={fecha}
        onChange={(event) => onCambiar(event.target.value)}
        className="selector-dia__entrada"
      />
      <Boton variant="secundario" onClick={() => onCambiar(hoyISO())}>
        Hoy
      </Boton>
    </div>
  );
}
