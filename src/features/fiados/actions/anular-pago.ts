"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";

export async function anularPago(pagoId: unknown): Promise<Resultado<boolean>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(pagoId)) return fallo("El identificador del pago no es válido.");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.findUnique({
        where: { id: pagoId },
        select: { clienteFiadoId: true, anulado: true },
      });
      if (!pago) return fallo("No se encontró el pago.", "validation");
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Cliente" WHERE "id" = ${pago.clienteFiadoId} FOR UPDATE`,
      );
      if (!pago.anulado) {
        await tx.pago.update({ where: { id: pagoId }, data: { anulado: true } });
      }
      return ok(true);
    });

    if (!resultado.ok) return resultado;
    revalidatePath("/");
    revalidatePath("/fiados");
    revalidatePath("/historial");
    return resultado;
  } catch (error) {
    console.error("fiados.anularPago", error);
    return fallo("No se pudo anular el pago.", "database");
  }
}
