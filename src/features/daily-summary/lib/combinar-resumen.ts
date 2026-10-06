import type { VentaPendiente } from "@/shared/types/venta";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import { fechaLocalISO } from "@/shared/lib/fechas";
import { redondearMonto } from "@/shared/lib/moneda";
import { obtenerEstadoPago } from "@/features/sales/lib/obtener-estado-pago";

export function combinarConPendientes(
  resumen: ResumenDiario | null,
  pendientes: VentaPendiente[],
  fechaISO: string,
): ResumenDiario {
  const clavesEnServidor = new Set(resumen?.clavesOperacion ?? []);
  const sumables = pendientes.filter(
    (pendiente) =>
      pendiente.estado !== "requiere-revision" &&
      !clavesEnServidor.has(pendiente.localId) &&
      obtenerEstadoPago(pendiente.venta) !== null,
  );
  const ventasDelDia = sumables.filter(
    (pendiente) => fechaLocalISO(new Date(pendiente.venta.fecha)) === fechaISO,
  );
  const enCentavos = (valor: number) => Math.round(redondearMonto(valor) * 100);
  const importeDe = (pendiente: VentaPendiente) =>
    pendiente.venta.items.reduce(
      (total, item) => total + item.cantidad * enCentavos(item.precioUnitario),
      0,
    );
  const vendidoOffline = ventasDelDia.reduce((total, pendiente) => total + importeDe(pendiente), 0);
  const cobradoOffline = ventasDelDia.reduce(
    (total, pendiente) =>
      total + (obtenerEstadoPago(pendiente.venta) === "PAGADA" ? importeDe(pendiente) : 0),
    0,
  );
  const fiadoOffline = ventasDelDia.reduce(
    (total, pendiente) =>
      total + (obtenerEstadoPago(pendiente.venta) !== "PAGADA" ? importeDe(pendiente) : 0),
    0,
  );
  const deudaOffline = sumables.reduce(
    (total, pendiente) =>
      total + (obtenerEstadoPago(pendiente.venta) !== "PAGADA" ? importeDe(pendiente) : 0),
    0,
  );
  const base = resumen ?? {
    fecha: fechaISO,
    vendido: 0,
    cobrado: 0,
    fiadoNuevo: 0,
    deudaTotal: 0,
    cantidadVentas: 0,
    cantidadACobrarHoy: 0,
  };

  return {
    ...base,
    fecha: fechaISO,
    vendido: (enCentavos(base.vendido) + vendidoOffline) / 100,
    cobrado: (enCentavos(base.cobrado) + cobradoOffline) / 100,
    fiadoNuevo: (enCentavos(base.fiadoNuevo) + fiadoOffline) / 100,
    deudaTotal: (enCentavos(base.deudaTotal) + deudaOffline) / 100,
    cantidadVentas: base.cantidadVentas + ventasDelDia.length,
    cantidadACobrarHoy:
      base.cantidadACobrarHoy +
      ventasDelDia.filter((pendiente) => obtenerEstadoPago(pendiente.venta) === "A_COBRAR_HOY")
        .length,
  };
}
