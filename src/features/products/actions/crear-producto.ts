"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { DatosProducto, Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { validarDatosProducto } from "@/features/products/lib/validar-producto";
import { mapearProducto } from "@/features/products/lib/mapear-producto";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export async function crearProducto(datos: DatosProducto): Promise<Resultado<Producto>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const validado = validarDatosProducto(datos);

  if (!validado.ok) {
    return fallo(validado.error);
  }

  try {
    const existente = await prisma.producto.findFirst({
      where: {
        activo: true,
        nombre: { equals: validado.data.nombre, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existente) return fallo("Ya existe un producto con ese nombre.");

    const producto = await prisma.producto.create({
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
    console.error("products.crearProducto", error);
    return fallo("No se pudo crear el producto.");
  }
}
