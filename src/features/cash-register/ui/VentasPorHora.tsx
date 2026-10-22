import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { VentasDeLaHora } from "@/shared/types/caja";

/** Barras simples con CSS: muestra desde la primera hasta la última hora con ventas. */
export function VentasPorHora({ franjas }: { franjas: VentasDeLaHora[] }): ReactElement {
  const conVentas = franjas.filter((franja) => franja.cantidad > 0);
  const desde = conVentas[0]?.hora ?? 0;
  const hasta = conVentas.at(-1)?.hora ?? 0;
  const visibles = franjas.filter((franja) => franja.hora >= desde && franja.hora <= hasta);
  const maximo = Math.max(...visibles.map((franja) => franja.importe), 0);

  return (
    <section className="seccion-caja" aria-labelledby="ventas-hora-titulo">
      <h2 id="ventas-hora-titulo">Ventas por hora</h2>
      {conVentas.length === 0 ? (
        <p className="estado-vacio">Todavía no hay ventas este día.</p>
      ) : (
        <ul className="ventas-hora">
          {visibles.map((franja) => (
            <li
              key={franja.hora}
              title={`${franja.hora} h: ${franja.cantidad} ventas, ${formatearPesos(franja.importe)}`}
            >
              <span className="ventas-hora__barra-contenedor" aria-hidden="true">
                <span
                  className="ventas-hora__barra"
                  style={{
                    height: `${maximo ? Math.max((franja.importe / maximo) * 100, 2) : 0}%`,
                  }}
                />
              </span>
              <span className="ventas-hora__hora">{franja.hora}</span>
              <span className="sr-only">
                {franja.cantidad} ventas por {formatearPesos(franja.importe)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
