"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";

export async function registrarCobroFiado(
  ventaId: unknown,
  importe: unknown,
): Promise<Resultado<{ saldoPendiente: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(ventaId)) return fallo("La venta fiada no es válida.", "validation");
  if (
    typeof importe !== "number" ||
    !Number.isFinite(importe) ||
    importe <= 0 ||
    importe > Number.MAX_SAFE_INTEGER / 100
  ) {
    return fallo("Ingresá un importe de cobro válido.", "validation");
  }
  const monto = Number(importe.toFixed(2));
  if (monto <= 0) return fallo("El importe de cobro debe ser mayor a cero.", "validation");

  try {
    const resultado = await prisma.$transaction(
      async (tx): Promise<Resultado<{ saldoPendiente: number }>> => {
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Venta" WHERE "id" = ${ventaId} FOR UPDATE`);
        const venta = await tx.venta.findUnique({
          where: { id: ventaId },
          include: { cobros: { select: { monto: true } } },
        });
        if (!venta || venta.tipoPago !== "FIADO" || venta.anulada) {
          return fallo("No se encontró una cuenta fiada pendiente.", "validation");
        }

        const cobrado = venta.cobros.reduce((suma, cobro) => suma + Number(cobro.monto), 0);
        const saldoPendiente = Number((Number(venta.total) - cobrado).toFixed(2));
        if (saldoPendiente <= 0) return fallo("Esta cuenta ya está cancelada.", "validation");
        if (monto > saldoPendiente) {
          return fallo("El cobro no puede superar el saldo pendiente.", "validation");
        }

        await tx.cobroFiado.create({
          data: { ventaId, monto: new Prisma.Decimal(monto.toFixed(2)), fecha: new Date() },
        });
        return ok({ saldoPendiente: Number((saldoPendiente - monto).toFixed(2)) });
      },
    );

    if (!resultado.ok) return resultado;
    revalidatePath("/");
    revalidatePath("/fiados");
    revalidatePath("/historial");
    return resultado;
  } catch (error) {
    console.error("credit.registrarCobroFiado", error);
    return fallo("No se pudo registrar el cobro.");
  }
}
