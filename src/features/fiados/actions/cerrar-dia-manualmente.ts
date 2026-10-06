"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import type { Resultado } from "@/shared/types/resultado";

export async function cerrarDiaManualmente(): Promise<Resultado<number>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const hoy = hoyISO();
    const diaSiguienteUTC = new Date(
      Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, Number(hoy.slice(8, 10)) + 1),
    );
    const mananaISO = [
      diaSiguienteUTC.getUTCFullYear(),
      String(diaSiguienteUTC.getUTCMonth() + 1).padStart(2, "0"),
      String(diaSiguienteUTC.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const { hasta } = rangoDelDia(mananaISO);
    const resultado = await prisma.venta.updateMany({
      where: {
        estadoPago: "A_COBRAR_HOY",
        anulada: false,
        fecha: { lt: hasta },
        clienteFiadoId: { not: null },
      },
      data: { estadoPago: "FIADA" },
    });
    revalidatePath("/");
    revalidatePath("/fiados");
    revalidatePath("/historial");
    return ok(resultado.count);
  } catch (error) {
    console.error("fiados.cerrarDiaManualmente", error);
    return fallo("No se pudieron pasar las ventas a cuenta mensual.", "database");
  }
}
