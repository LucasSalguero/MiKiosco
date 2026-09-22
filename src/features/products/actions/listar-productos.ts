"use server";

import prisma from "@/shared/db/client";
import { ok, fallo } from "@/shared/lib/resultado";
import type { Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { mapearProducto } from "@/features/products/lib/mapear-producto";

export async function listarProductosActivos(): Promise<Resultado<Producto[]>> {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return ok(productos.map(mapearProducto));
  } catch (error) {
    console.error("products.listarProductosActivos", error);
    return fallo("No se pudieron cargar los productos.");
  }
}
