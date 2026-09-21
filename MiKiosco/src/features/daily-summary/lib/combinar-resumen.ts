import type { VentaPendiente } from "@/shared/types/venta";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

export function combinarConPendientes(
  resumen: ResumenDiario | null,
  pendientes: VentaPendiente[],
  fechaISO: string,
): ResumenDiario {
  const totalPendiente = pendientes.reduce((total, pendiente) => {
    if (pendiente.venta.fecha !== fechaISO) {
      return total;
    }

    return total + pendiente.venta.items.reduce((subtotal, item) => {
      return subtotal + item.cantidad * item.precioUnitario;
    }, 0);
  }, 0);

  const base = resumen ?? { fecha: fechaISO, total: 0, cantidadVentas: 0 };

  return {
    fecha: fechaISO,
    total: base.total + totalPendiente,
    cantidadVentas: base.cantidadVentas + pendientes.filter((pendiente) => pendiente.venta.fecha === fechaISO).length,
  };
}
