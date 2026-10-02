"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { DatosProducto, Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { validarDatosProducto } from "@/features/products/lib/validar-producto";
import { mapearProducto } from "@/features/products/lib/mapear-producto";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";

export async function actualizarProducto(
  id: number,
  datos: DatosProducto,
): Promise<Resultado<Producto>> {
  const validado = validarDatosProducto(datos);

  if (!validado.ok) {
    return fallo(validado.error);
  }
  if (!esIdEnteroValido(id)) return fallo("El identificador del producto no es válido.");
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const existente = await prisma.producto.findFirst({
      where: {
        activo: true,
        id: { not: id },
        nombre: { equals: validado.data.nombre, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existente) return fallo("Ya existe un producto con ese nombre.");

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre: validado.data.nombre,
        precio: validado.data.precio,
      },
    });

    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath("/historial");
    return ok(mapearProducto(producto));
  } catch (error) {
    console.error("products.actualizarProducto", error);
    return fallo("No se pudo actualizar el producto.");
  }
}
