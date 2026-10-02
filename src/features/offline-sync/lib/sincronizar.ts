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
  forzarReintento = false,
): Promise<
  Resultado<{
    enviadas: number;
    fallidas: number;
    requierenRevision: number;
    proximoIntento?: string;
  }>
> {
  if (sincronizacionEnCurso) {
    return ok({ enviadas: 0, fallidas: 0, requierenRevision: 0 });
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
    let requierenRevision = 0;
    const ahora = Date.now();
    let proximoIntento: number | undefined;

    for (const pendiente of ordenadas) {
      if (pendiente.estado === "requiere-revision") {
        requierenRevision += 1;
        continue;
      }
      if (pendiente.proximoIntento && new Date(pendiente.proximoIntento).getTime() > ahora) {
        if (!forzarReintento) {
          const vencimiento = new Date(pendiente.proximoIntento).getTime();
          proximoIntento = Math.min(proximoIntento ?? vencimiento, vencimiento);
          continue;
        }
      }

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
        ...(respuesta.code === "validation"
          ? { estado: "requiere-revision" as const, proximoIntento: undefined }
          : {
              proximoIntento: new Date(
                Date.now() + [5000, 15000, 60000, 300000][Math.min(pendiente.intentos, 3)],
              ).toISOString(),
            }),
      });
      if (respuesta.code !== "validation") {
        const vencimiento = new Date(
          Date.now() + [5000, 15000, 60000, 300000][Math.min(pendiente.intentos, 3)],
        ).getTime();
        proximoIntento = Math.min(proximoIntento ?? vencimiento, vencimiento);
      }

      if (!actualizada.ok) {
        console.error("offline-sync.sincronizarPendientes", actualizada.error);
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ventas-pendientes-cambio"));
      }

      fallidas += 1;
      if (respuesta.code === "validation") {
        requierenRevision += 1;
        continue;
      }
      if (respuesta.code === "network") {
        break;
      }
    }

    return ok({
      enviadas,
      fallidas,
      requierenRevision,
      ...(proximoIntento ? { proximoIntento: new Date(proximoIntento).toISOString() } : {}),
    });
  } catch (error) {
    console.error("offline-sync.sincronizarPendientes", error);
    return fallo("No se pudo sincronizar las ventas pendientes.", "network");
  } finally {
    sincronizacionEnCurso = false;
  }
}
