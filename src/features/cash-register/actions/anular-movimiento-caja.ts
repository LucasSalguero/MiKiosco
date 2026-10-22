"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/shared/db/client";
import { bloquearDia } from "@/features/cash-register/lib/cargar-dia";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { fechaLocalISO } from "@/shared/lib/fechas";
import { fallo, ok } from "@/shared/lib/resultado";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";

/** Anula un movimiento de caja. No se permite si su día ya está cerrado. */
export async function anularMovimientoCaja(id: unknown): Promise<Resultado<boolean>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(id)) return fallo("El movimiento no es válido.", "validation");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoCaja.findUnique({
        where: { id },
        select: { fecha: true, anulado: true },
      });
      if (!movimiento) return fallo("No se encontró el movimiento.", "validation");

      const dia = fechaLocalISO(movimiento.fecha);
      await bloquearDia(tx, dia);
      const cierre = await tx.cierreCaja.findUnique({
        where: { fecha: dia },
        select: { id: true },
      });
      if (cierre) {
        return fallo("La caja de ese día ya está cerrada. No se puede anular.", "validation");
      }
      if (!movimiento.anulado) {
        await tx.movimientoCaja.update({ where: { id }, data: { anulado: true } });
      }
      return ok(true);
    });
    if (resultado.ok) revalidatePath("/caja");
    return resultado;
  } catch (error) {
    console.error("cash-register.anularMovimientoCaja", error);
    return fallo("No se pudo anular el movimiento.", "database");
  }
}
