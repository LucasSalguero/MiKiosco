import type { NuevaVenta } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";
import { fallo, ok } from "@/shared/lib/resultado";
import { crearVenta } from "@/features/sales/actions/crear-venta";
import { encolarVenta } from "@/features/offline-sync/lib/cola-ventas";

export type VentaRegistrada = { estado: "sincronizada"; id: number } | { estado: "pendiente"; localId: string };
export async function registrarVenta(venta: NuevaVenta): Promise<Resultado<VentaRegistrada>> {
  const guardarPendiente = async (): Promise<Resultado<VentaRegistrada>> => { const pendiente = await encolarVenta(venta); return pendiente.ok ? ok({ estado: "pendiente", localId: pendiente.data.localId }) : fallo(pendiente.error); };
  if (typeof navigator !== "undefined" && !navigator.onLine) return guardarPendiente();
  try { const resultado = await crearVenta(venta); if (resultado.ok) return ok({ estado: "sincronizada", id: resultado.data.id }); if (resultado.error.includes("La fecha") || resultado.error.includes("producto") || resultado.error.includes("venta")) return fallo(resultado.error); return guardarPendiente(); } catch (error) { console.error("sales.registrarVenta", error); return guardarPendiente(); }
}
