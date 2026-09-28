import type { NuevaVenta } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";
import { fallo, ok } from "@/shared/lib/resultado";
import { crearVenta } from "@/features/sales/actions/crear-venta";
import { encolarVenta } from "@/features/offline-sync/lib/cola-ventas";

export type VentaRegistrada =
  { estado: "sincronizada"; id: number } | { estado: "pendiente"; localId: string };

export async function registrarVenta(venta: NuevaVenta): Promise<Resultado<VentaRegistrada>> {
  const localId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : null;

  if (!localId) {
    return fallo("No se pudo preparar la venta para sincronizar.", "storage");
  }

  const guardarPendiente = async (): Promise<Resultado<VentaRegistrada>> => {
    const pendiente = await encolarVenta(venta, localId);
    return pendiente.ok
      ? ok({ estado: "pendiente", localId: pendiente.data.localId })
      : fallo(pendiente.error, pendiente.code);
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return guardarPendiente();
  }

  try {
    const resultado = await crearVenta(venta, localId);
    if (resultado.ok) {
      return ok({ estado: "sincronizada", id: resultado.data.id });
    }
    if (resultado.code === "validation") {
      return fallo(resultado.error, resultado.code);
    }
    return guardarPendiente();
  } catch (error) {
    console.error("sales.registrarVenta", error);
    return guardarPendiente();
  }
}
