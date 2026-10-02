import type { Producto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { leerProductosCache, guardarProductosCache } from "@/shared/lib/storage";
import { fallo, ok } from "@/shared/lib/resultado";

import { listarProductosActivos } from "@/features/products/actions/listar-productos";

const TIMEOUT_CARGA_PRODUCTOS_MS = 8000;

export async function cargarProductos(): Promise<
  Resultado<{ productos: Producto[]; origen: "servidor" | "cache" }>
> {
  let resultadoServidor;
  try {
    let temporizador: number | undefined;
    try {
      resultadoServidor = await Promise.race([
        listarProductosActivos(),
        new Promise<never>((_, reject) => {
          temporizador = window.setTimeout(
            () => reject(new Error("Timeout al cargar productos")),
            TIMEOUT_CARGA_PRODUCTOS_MS,
          );
        }),
      ]);
    } finally {
      if (temporizador !== undefined) window.clearTimeout(temporizador);
    }
  } catch (error) {
    console.error("products.cargarProductos", error);
    resultadoServidor = fallo("No se pudieron cargar los productos.", "network");
  }

  if (resultadoServidor.ok) {
    const resultadoCache = await guardarProductosCache(resultadoServidor.data);
    if (!resultadoCache.ok) {
      console.error("products.cargarProductos.cache", resultadoCache.error);
    }
    return ok({ productos: resultadoServidor.data, origen: "servidor" });
  }

  const resultadoCache = await leerProductosCache();

  if (resultadoCache.ok && resultadoCache.data.length > 0) {
    return ok({ productos: resultadoCache.data, origen: "cache" });
  }

  console.error("products.cargarProductos", resultadoServidor.error);
  return fallo("No se pudieron cargar los productos.", resultadoServidor.code);
}
