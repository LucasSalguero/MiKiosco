import type { NuevaVenta } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";

import { fallo, ok } from "@/shared/lib/resultado";

import { crearVenta } from "@/features/sales/actions/crear-venta";
import { encolarVenta } from "@/features/offline-sync/lib/cola-ventas";

export async function registrarVenta(
  venta: NuevaVenta,
): Promise<Resultado<{ estado: "sincronizada" | "pendiente" }>> {
  const esOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!esOnline) {
    const pendiente = await encolarVenta(venta);
    if (!pendiente.ok) {
      return fallo(pendiente.error);
    }
    return ok({ estado: "pendiente" });
  }

  try {
    const resultado = await crearVenta(venta);

    if (resultado.ok) {
      return ok({ estado: "sincronizada" });
    }

    if (resultado.error.includes("La fecha") || resultado.error.includes("producto") || resultado.error.includes("venta")) {
      return fallo(resultado.error);
    }

    const pendiente = await encolarVenta(venta);
    if (!pendiente.ok) {
      return fallo(pendiente.error);
    }

    return ok({ estado: "pendiente" });
  } catch (error) {
    console.error("sales.registrarVenta", error);
    const pendiente = await encolarVenta(venta);
    if (!pendiente.ok) {
      return fallo(pendiente.error);
    }
    return ok({ estado: "pendiente" });
  }
}
