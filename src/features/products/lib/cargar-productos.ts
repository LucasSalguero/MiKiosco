import type { Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { leerProductosCache, guardarProductosCache } from "@/shared/lib/storage";
import { fallo, ok } from "@/shared/lib/resultado";

import { listarProductosActivos } from "@/features/products/actions/listar-productos";

export async function cargarProductos(): Promise<
  Resultado<{ productos: Producto[]; origen: "servidor" | "cache" }>
> {
  const resultadoServidor = await listarProductosActivos();

  if (resultadoServidor.ok) {
    await guardarProductosCache(resultadoServidor.data);
    return ok({ productos: resultadoServidor.data, origen: "servidor" });
  }

  const resultadoCache = await leerProductosCache();

  if (resultadoCache.ok && resultadoCache.data.length > 0) {
    return ok({ productos: resultadoCache.data, origen: "cache" });
  }

  console.error("products.cargarProductos", resultadoServidor.error);
  return fallo("No se pudieron cargar los productos.");
}
