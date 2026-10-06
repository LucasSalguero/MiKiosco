import { Prisma } from "@prisma/client";

export type VentaParaSaldo = {
  id: number;
  fecha: Date | string;
  total: Prisma.Decimal.Value;
  pagosAsociados: readonly Prisma.Decimal.Value[];
};

export function calcularSaldosVentas(
  ventas: readonly VentaParaSaldo[],
  pagosGenerales: readonly Prisma.Decimal.Value[],
): Map<number, number> {
  const ordenadas = [...ventas].sort((a, b) => {
    const diferencia = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    return diferencia || a.id - b.id;
  });
  let saldoGeneral = Prisma.Decimal.max(
    pagosGenerales.reduce<Prisma.Decimal>(
      (suma, monto) => suma.plus(monto),
      new Prisma.Decimal(0),
    ),
    0,
  );
  const saldos = new Map<number, number>();

  for (const venta of ordenadas) {
    const saldoDirecto = new Prisma.Decimal(venta.total)
      .minus(
        venta.pagosAsociados.reduce<Prisma.Decimal>(
          (suma, monto) => suma.plus(monto),
          new Prisma.Decimal(0),
        ),
      )
      .toDecimalPlaces(2);
    const restante = Prisma.Decimal.max(saldoDirecto, 0);
    const aplicado = Prisma.Decimal.min(restante, saldoGeneral);
    saldos.set(venta.id, restante.minus(aplicado).toDecimalPlaces(2).toNumber());
    saldoGeneral = saldoGeneral.minus(aplicado);
  }

  return saldos;
}
