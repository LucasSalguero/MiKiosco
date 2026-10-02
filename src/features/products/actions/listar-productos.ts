"use server";

import prisma from "@/shared/db/client";
import { ok, fallo } from "@/shared/lib/resultado";
import type { Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { mapearProducto } from "@/features/products/lib/mapear-producto";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export async function listarProductosActivos(): Promise<Resultado<Producto[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

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

export async function listarProductosGestion(): Promise<Resultado<Producto[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" },
    });

    return ok(productos.map(mapearProducto));
  } catch (error) {
    console.error("products.listarProductosGestion", error);
    return fallo("No se pudieron cargar los productos.");
  }
}
