import type { Resultado } from "@/shared/types/resultado";
import type { NuevaVenta } from "@/shared/types/venta";

import { fallo, ok } from "@/shared/lib/resultado";
import {
  actualizarVentaPendiente,
  eliminarVentaPendiente,
  listarVentasPendientes,
} from "@/shared/lib/storage";

export type EnviarVenta = (
  venta: NuevaVenta,
  clienteId: string,
) => Promise<Resultado<{ id: number }>>;

let sincronizacionEnCurso = false;

export async function sincronizarPendientes(
  enviar: EnviarVenta,
): Promise<Resultado<{ enviadas: number; fallidas: number }>> {
  if (sincronizacionEnCurso) {
    return ok({ enviadas: 0, fallidas: 0 });
  }

  sincronizacionEnCurso = true;

  try {
    const pendientes = await listarVentasPendientes();
    if (!pendientes.ok) {
      return pendientes;
    }

    const ordenadas = [...pendientes.data].sort((a, b) => a.creadaEn.localeCompare(b.creadaEn));

    let enviadas = 0;
    let fallidas = 0;

    for (const pendiente of ordenadas) {
      const respuesta = await enviar(pendiente.venta, pendiente.localId);

      if (respuesta.ok) {
        const eliminado = await eliminarVentaPendiente(pendiente.localId);
        if (!eliminado.ok) {
          console.error("offline-sync.sincronizarPendientes", eliminado.error);
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ventas-pendientes-cambio"));
        }
        enviadas += 1;
        continue;
      }

      const actualizada = await actualizarVentaPendiente(pendiente.localId, {
        ...pendiente,
        intentos: pendiente.intentos + 1,
        ultimoError: respuesta.error,
      });

      if (!actualizada.ok) {
        console.error("offline-sync.sincronizarPendientes", actualizada.error);
      }

      fallidas += 1;
      if (respuesta.code !== "database" && respuesta.code !== "network") {
        break;
      }
    }

    return ok({ enviadas, fallidas });
  } catch (error) {
    console.error("offline-sync.sincronizarPendientes", error);
    return fallo("No se pudo sincronizar las ventas pendientes.", "network");
  } finally {
    sincronizacionEnCurso = false;
  }
}
