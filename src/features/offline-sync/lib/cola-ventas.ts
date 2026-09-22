import type { NuevaVenta, VentaPendiente } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";

import { fallo, ok } from "@/shared/lib/resultado";
import { eliminarVentaPendiente, guardarVentaPendiente, listarVentasPendientes } from "@/shared/lib/storage";

export async function encolarVenta(venta: NuevaVenta): Promise<Resultado<VentaPendiente>> {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    return fallo("No se pudo preparar la venta para sincronizar.");
  }

  const pendiente: VentaPendiente = {
    localId: crypto.randomUUID(),
    venta,
    creadaEn: new Date().toISOString(),
    intentos: 0,
  };

  const resultado = await guardarVentaPendiente(pendiente);

  if (!resultado.ok) {
    console.error("offline-sync.encolarVenta", resultado.error);
    return fallo("No se pudo guardar la venta sin conexión.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ventas-pendientes-cambio"));
  }

  return ok(pendiente);
}

export async function obtenerPendientes(): Promise<Resultado<VentaPendiente[]>> {
  const resultado = await listarVentasPendientes();
  if (!resultado.ok) {
    return resultado;
  }

  return ok(resultado.data.sort((a, b) => a.creadaEn.localeCompare(b.creadaEn)));
}

export async function contarPendientes(): Promise<Resultado<number>> {
  const pendientes = await obtenerPendientes();
  if (!pendientes.ok) {
    return pendientes;
  }

  return ok(pendientes.data.length);
}

export async function quitarVentaPendiente(localId: string): Promise<Resultado<boolean>> {
  const resultado = await eliminarVentaPendiente(localId);
  if (resultado.ok && typeof window !== "undefined") window.dispatchEvent(new Event("ventas-pendientes-cambio"));
  return resultado;
}
