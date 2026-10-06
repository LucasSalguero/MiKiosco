"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import type { Resultado } from "@/shared/types/resultado";

export async function consolidarVencidasDelDia(): Promise<Resultado<number>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const { desde } = rangoDelDia(hoyISO());
    const resultado = await prisma.venta.updateMany({
      where: {
        estadoPago: "A_COBRAR_HOY",
        anulada: false,
        fecha: { lt: desde },
        clienteFiadoId: { not: null },
      },
      data: { estadoPago: "FIADA" },
    });
    revalidatePath("/");
    revalidatePath("/fiados");
    revalidatePath("/historial");
    return ok(resultado.count);
  } catch (error) {
    console.error("fiados.consolidarVencidasDelDia", error);
    return fallo("No se pudieron pasar las ventas vencidas a cuenta mensual.", "database");
  }
}
