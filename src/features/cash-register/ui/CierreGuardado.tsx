import type { ReactElement } from "react";

import { calcularDiferencia } from "@/features/cash-register/lib/calcular-diferencia";
import { ZONA_HORARIA } from "@/shared/lib/fechas";
import { aCentavos, formatearPesos } from "@/shared/lib/moneda";
import type { CierreCaja, PosterioresAlCierre } from "@/shared/types/caja";

const TEXTO_DIFERENCIA = { exacto: "Sin diferencia", faltante: "Faltante", sobrante: "Sobrante" };

export function CierreGuardado({
  cierre,
  posteriores,
}: {
  cierre: CierreCaja;
  posteriores: PosterioresAlCierre;
}): ReactElement {
  const { estado } = calcularDiferencia(
    aCentavos(cierre.efectivoContado),
    aCentavos(cierre.efectivoEsperado),
  );
  const filas: Array<[string, string]> = [
    ["Fondo inicial", formatearPesos(cierre.fondoInicial)],
    ["Ventas en efectivo y cobros de fiados", formatearPesos(cierre.totalEfectivo)],
    ["Ingresos", `+${formatearPesos(cierre.totalIngresos)}`],
    ["Egresos", `−${formatearPesos(cierre.totalEgresos)}`],
    ["Retiros", `−${formatearPesos(cierre.totalRetiros)}`],
    ["Efectivo esperado", formatearPesos(cierre.efectivoEsperado)],
    ["Efectivo contado", formatearPesos(cierre.efectivoContado)],
    ["Vendido total", formatearPesos(cierre.totalVendido)],
  ];
  const importePosterior = posteriores.importeVentas + posteriores.importeCobros;

  return (
    <section className="seccion-caja arqueo-caja" aria-labelledby="cierre-titulo">
      <h2 id="cierre-titulo">Cierre guardado</h2>
      <p className="arqueo-caja__cerrado-en">
        Cerrada el{" "}
        {new Intl.DateTimeFormat("es-AR", {
          timeZone: ZONA_HORARIA,
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(cierre.cerradoEn))}
      </p>
      {importePosterior > 0 ? (
        <p className="aviso-caja" role="alert">
          Hay ventas posteriores al cierre por {formatearPesos(importePosterior)}
          {posteriores.importeCobros > 0
            ? ` (incluye ${formatearPesos(posteriores.importeCobros)} de cobros de fiados)`
            : ""}
          . El cierre no se modifica.
        </p>
      ) : null}
      <dl className="arqueo-caja__detalle">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
      <div className={`diferencia-caja diferencia-caja--${estado}`}>
        <span>{TEXTO_DIFERENCIA[estado]}</span>
        <strong>{formatearPesos(Math.abs(cierre.diferencia))}</strong>
      </div>
      {cierre.observaciones ? (
        <p className="arqueo-caja__observaciones-guardadas">{cierre.observaciones}</p>
      ) : null}
    </section>
  );
}
