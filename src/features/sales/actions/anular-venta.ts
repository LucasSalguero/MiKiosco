"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";
import { obtenerSaldoCliente } from "@/features/fiados/lib/obtener-saldo-cliente";
import { decimalANumero } from "@/shared/lib/moneda";

export async function anularVenta(id: number): Promise<Resultado<boolean>> {
  if (!esIdEnteroValido(id)) return fallo("El identificador de la venta no es válido.");
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        select: {
          anulada: true,
          total: true,
          clienteFiadoId: true,
          estadoPago: true,
        },
      });
      if (!venta) return fallo("No se encontró la venta.");
      if (venta.anulada) return ok(true);

      if (venta.clienteFiadoId !== null) {
        await tx.$queryRaw(
          Prisma.sql`SELECT "id" FROM "Cliente" WHERE "id" = ${venta.clienteFiadoId} FOR UPDATE`,
        );
        const pagosAsociados = await tx.pago.count({
          where: { ventaId: id, anulado: false },
        });
        if (pagosAsociados > 0) {
          return fallo("No se puede anular: esta venta tiene pagos asociados.");
        }
        if (venta.estadoPago !== "PAGADA") {
          const saldo = await obtenerSaldoCliente(tx, venta.clienteFiadoId);
          if (Math.round(saldo * 100) - Math.round(decimalANumero(venta.total) * 100) < 0) {
            return fallo(
              "No se puede anular porque los pagos registrados superarían la deuda restante.",
            );
          }
        }
      }
      await tx.venta.update({ where: { id }, data: { anulada: true } });
      return ok(true);
    });
    if (!resultado.ok) return resultado;
    revalidatePath("/");
    revalidatePath("/historial");
    revalidatePath("/fiados");
    return resultado;
  } catch (error) {
    console.error("sales.anularVenta", error);
    return fallo("No se pudo deshacer la venta. Revisá el historial.");
  }
}
