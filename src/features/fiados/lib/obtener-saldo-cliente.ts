import type { Prisma } from "@prisma/client";

import { calcularSaldo } from "@/features/fiados/lib/calcular-saldo";

export async function obtenerSaldoCliente(
  tx: Prisma.TransactionClient,
  clienteFiadoId: number,
): Promise<number> {
  const [ventas, pagos] = await Promise.all([
    tx.venta.groupBy({
      by: ["estadoPago"],
      where: { clienteFiadoId, anulada: false },
      _sum: { total: true },
    }),
    tx.pago.aggregate({
      where: { clienteFiadoId, anulado: false },
      _sum: { monto: true },
    }),
  ]);

  return calcularSaldo(
    ventas.map((venta) => ({
      estadoPago: venta.estadoPago,
      total: Number(venta._sum.total ?? 0),
      anulada: false,
    })),
    [{ monto: Number(pagos._sum.monto ?? 0), anulado: false }],
  );
}
