import type { VentaPendiente } from "@/shared/types/venta";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import { fechaLocalISO } from "@/shared/lib/fechas";

export function combinarConPendientes(
  resumen: ResumenDiario | null,
  pendientes: VentaPendiente[],
  fechaISO: string,
): ResumenDiario {
  const idsEnServidor = new Set(resumen?.clienteIds ?? []);
  const sumables = pendientes.filter(
    (pendiente) =>
      pendiente.estado !== "requiere-revision" && !idsEnServidor.has(pendiente.localId),
  );
  const totalPendiente = pendientes.reduce((total, pendiente) => {
    if (
      pendiente.estado === "requiere-revision" ||
      idsEnServidor.has(pendiente.localId) ||
      fechaLocalISO(new Date(pendiente.venta.fecha)) !== fechaISO
    ) {
      return total;
    }

    return (
      total +
      pendiente.venta.items.reduce((subtotal, item) => {
        return subtotal + item.cantidad * item.precioUnitario;
      }, 0)
    );
  }, 0);

  const base = resumen ?? { fecha: fechaISO, total: 0, cantidadVentas: 0 };

  return {
    fecha: fechaISO,
    total: base.total + totalPendiente,
    cantidadVentas:
      base.cantidadVentas +
      sumables.filter((pendiente) => fechaLocalISO(new Date(pendiente.venta.fecha)) === fechaISO)
        .length,
  };
}
