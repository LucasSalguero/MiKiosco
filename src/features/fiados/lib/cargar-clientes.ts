import { listarClientes } from "@/features/fiados/actions/listar-clientes";
import { fallo, ok } from "@/shared/lib/resultado";
import { leerClientesCache, guardarClientesCache } from "@/shared/lib/storage";
import type { Cliente } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";

const TIMEOUT_CARGA_CLIENTES_MS = 8000;

export async function cargarClientes(): Promise<
  Resultado<{ clientes: Cliente[]; origen: "servidor" | "cache" }>
> {
  let resultadoServidor;
  try {
    let temporizador: number | undefined;
    try {
      resultadoServidor = await Promise.race([
        listarClientes(),
        new Promise<never>((_, reject) => {
          temporizador = window.setTimeout(
            () => reject(new Error("Timeout al cargar clientes")),
            TIMEOUT_CARGA_CLIENTES_MS,
          );
        }),
      ]);
    } finally {
      if (temporizador !== undefined) window.clearTimeout(temporizador);
    }
  } catch (error) {
    console.error("fiados.cargarClientes", error);
    resultadoServidor = fallo("No se pudieron cargar los clientes.", "network");
  }

  if (resultadoServidor.ok) {
    const resultadoCache = await guardarClientesCache(resultadoServidor.data);
    if (!resultadoCache.ok) {
      console.error("fiados.cargarClientes.cache", resultadoCache.error);
    }
    return ok({ clientes: resultadoServidor.data, origen: "servidor" });
  }

  const resultadoCache = await leerClientesCache();
  if (resultadoCache.ok && resultadoCache.data.length > 0) {
    return ok({ clientes: resultadoCache.data, origen: "cache" });
  }

  return fallo("No se pudieron cargar los clientes.", resultadoServidor.code);
}
