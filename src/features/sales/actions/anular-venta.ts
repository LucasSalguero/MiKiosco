"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export async function anularVenta(id: number): Promise<Resultado<boolean>> {
  if (!Number.isInteger(id) || id <= 0) return fallo("El identificador de la venta no es válido.");

  try {
    const venta = await prisma.venta.findUnique({ where: { id }, select: { anulada: true } });
    if (!venta) return fallo("No se encontró la venta.");
    if (venta.anulada) return ok(true);

    await prisma.venta.update({ where: { id }, data: { anulada: true } });
    revalidatePath("/");
    revalidatePath("/historial");
    return ok(true);
  } catch (error) {
    console.error("sales.anularVenta", error);
    return fallo("No se pudo deshacer la venta. Revisá el historial.");
  }
}
