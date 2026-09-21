"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export async function desactivarProducto(id: number): Promise<Resultado<boolean>> {
  try {
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return ok(true);
  } catch (error) {
    console.error("products.desactivarProducto", error);
    return fallo("No se pudo desactivar el producto.");
  }
}
