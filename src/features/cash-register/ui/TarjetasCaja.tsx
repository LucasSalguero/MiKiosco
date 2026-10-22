import type { ReactElement } from "react";

import { formatearCantidad, formatearPesos } from "@/shared/lib/moneda";

export function TarjetasCaja({
  cobrado,
  efectivo,
  transferencia,
  desconocido,
  fiadoNuevo,
  cantidadVentas,
  ticketPromedio,
}: {
  cobrado: number;
  efectivo: number;
  transferencia: number;
  desconocido: number;
  fiadoNuevo: number;
  cantidadVentas: number;
  ticketPromedio: number;
}): ReactElement {
  const importes: Array<[string, number]> = [
    ["Cobrado total", cobrado],
    ["Efectivo", efectivo],
    ["Transferencia", transferencia],
    ["Fiado nuevo", fiadoNuevo],
  ];

  return (
    <section className="resumen-historial tarjetas-caja" aria-label="Resumen de caja">
      {importes.map(([etiqueta, importe]) => (
        <article key={etiqueta}>
          <span>{etiqueta}</span>
          <strong>{formatearPesos(importe)}</strong>
        </article>
      ))}
      <article>
        <span>Ventas</span>
        <strong>{formatearCantidad(cantidadVentas)}</strong>
      </article>
      <article>
        <span>Ticket promedio</span>
        <strong>{formatearPesos(ticketPromedio)}</strong>
      </article>
      {desconocido > 0 ? (
        <p className="tarjetas-caja__nota">
          Incluye {formatearPesos(desconocido)} cobrados sin medio registrado (ventas anteriores al
          dato). No se cuentan en el efectivo esperado.
        </p>
      ) : null}
    </section>
  );
}
