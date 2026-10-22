import { aCentavos, type MontoDecimal } from "@/shared/lib/moneda";

export type VentaParaSaldo = {
  id: number;
  fecha: Date | string;
  total: MontoDecimal;
  pagosAsociados: readonly MontoDecimal[];
};

/**
 * Devuelve el saldo pendiente de cada venta. Los pagos generales (sin venta
 * asociada) se aplican primero a las ventas más antiguas. Calcula en centavos.
 */
export function calcularSaldosVentas(
  ventas: readonly VentaParaSaldo[],
  pagosGenerales: readonly MontoDecimal[],
): Map<number, number> {
  const ordenadas = [...ventas].sort((a, b) => {
    const diferencia = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    return diferencia || a.id - b.id;
  });
  let saldoGeneral = Math.max(
    pagosGenerales.reduce<number>((suma, monto) => suma + aCentavos(monto), 0),
    0,
  );
  const saldos = new Map<number, number>();

  for (const venta of ordenadas) {
    const saldoDirecto =
      aCentavos(venta.total) -
      venta.pagosAsociados.reduce<number>((suma, monto) => suma + aCentavos(monto), 0);
    const restante = Math.max(saldoDirecto, 0);
    const aplicado = Math.min(restante, saldoGeneral);
    saldos.set(venta.id, (restante - aplicado) / 100);
    saldoGeneral -= aplicado;
  }

  return saldos;
}
