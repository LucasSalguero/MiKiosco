"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";

export async function desactivarProducto(id: number): Promise<Resultado<boolean>> {
  if (!esIdEnteroValido(id)) return fallo("El identificador del producto no es válido.");
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath("/historial");
    return ok(true);
  } catch (error) {
    console.error("products.desactivarProducto", error);
    return fallo("No se pudo desactivar el producto.");
  }
}
