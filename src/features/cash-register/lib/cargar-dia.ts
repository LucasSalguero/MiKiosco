import "server-only";

import type { Prisma } from "@prisma/client";

import { topProductos } from "@/features/cash-register/lib/agrupar-productos";
import { calcularArqueo, type ArqueoCentavos } from "@/features/cash-register/lib/calcular-arqueo";
import { ventasPorHora } from "@/features/cash-register/lib/ventas-por-hora";
import { rangoDelDia } from "@/shared/lib/fechas";
import { aCentavos } from "@/shared/lib/moneda";
import type {
  CierreCaja,
  MovimientoCaja,
  ProductoVendido,
  VentasDeLaHora,
} from "@/shared/types/caja";

type Cliente = Prisma.TransactionClient;

export type DiaCargado = {
  arqueo: ArqueoCentavos;
  movimientos: MovimientoCaja[];
  topProductos: ProductoVendido[];
  ventasPorHora: VentasDeLaHora[];
};

/** Lee ventas, pagos de fiados y movimientos de un día local y calcula el arqueo en centavos. */
export async function cargarDia(
  tx: Cliente,
  fecha: string,
  fondoInicialCentavos: number,
): Promise<DiaCargado> {
  const { desde, hasta } = rangoDelDia(fecha);
  const [ventas, pagos, movimientos] = await Promise.all([
    tx.venta.findMany({
      where: { fecha: { gte: desde, lt: hasta } },
      select: {
        fecha: true,
        total: true,
        estadoPago: true,
        medioPago: true,
        anulada: true,
        items: {
          select: { productoId: true, productoNombre: true, cantidad: true, precioUnitario: true },
        },
      },
    }),
    tx.pago.findMany({
      where: { fecha: { gte: desde, lt: hasta } },
      select: { monto: true, medio: true, anulado: true },
    }),
    tx.movimientoCaja.findMany({
      where: { fecha: { gte: desde, lt: hasta } },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const arqueo = calcularArqueo({
    ventas: ventas.map((venta) => ({
      totalCentavos: aCentavos(venta.total),
      estadoPago: venta.estadoPago,
      medioPago: venta.medioPago,
      anulada: venta.anulada,
    })),
    pagos: pagos.map((pago) => ({
      montoCentavos: aCentavos(pago.monto),
      medio: pago.medio,
      anulado: pago.anulado,
    })),
    movimientos: movimientos.map((movimiento) => ({
      tipo: movimiento.tipo,
      montoCentavos: aCentavos(movimiento.monto),
      anulado: movimiento.anulado,
    })),
    fondoInicialCentavos,
  });

  const vigentes = ventas.filter((venta) => !venta.anulada);
  return {
    arqueo,
    movimientos: movimientos.map((movimiento) => ({
      id: movimiento.id,
      fecha: movimiento.fecha.toISOString(),
      tipo: movimiento.tipo,
      monto: aCentavos(movimiento.monto) / 100,
      motivo: movimiento.motivo,
      anulado: movimiento.anulado,
    })),
    topProductos: topProductos(
      vigentes.flatMap((venta) =>
        venta.items.map((item) => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          cantidad: item.cantidad,
          precioUnitarioCentavos: aCentavos(item.precioUnitario),
        })),
      ),
    ).map((producto) => ({ ...producto, importe: producto.importe / 100 })),
    ventasPorHora: ventasPorHora(
      ventas.map((venta) => ({
        fecha: venta.fecha,
        totalCentavos: aCentavos(venta.total),
        anulada: venta.anulada,
      })),
    ).map((franja) => ({ ...franja, importe: franja.importe / 100 })),
  };
}

type CierrePersistido = {
  [K in keyof Omit<CierreCaja, "cerradoEn" | "observaciones" | "cantidadVentas" | "fecha">]: {
    toString: () => string;
  };
} & {
  fecha: string;
  cantidadVentas: number;
  observaciones: string | null;
  cerradoEn: Date;
};

export function mapearCierre(cierre: CierrePersistido): CierreCaja {
  const pesos = (valor: { toString: () => string }) => aCentavos(valor) / 100;
  return {
    fecha: cierre.fecha,
    fondoInicial: pesos(cierre.fondoInicial),
    efectivoEsperado: pesos(cierre.efectivoEsperado),
    efectivoContado: pesos(cierre.efectivoContado),
    diferencia: pesos(cierre.diferencia),
    totalVendido: pesos(cierre.totalVendido),
    totalCobrado: pesos(cierre.totalCobrado),
    totalEfectivo: pesos(cierre.totalEfectivo),
    totalTransfer: pesos(cierre.totalTransfer),
    totalDesconocido: pesos(cierre.totalDesconocido),
    fiadoNuevo: pesos(cierre.fiadoNuevo),
    totalEgresos: pesos(cierre.totalEgresos),
    totalRetiros: pesos(cierre.totalRetiros),
    totalIngresos: pesos(cierre.totalIngresos),
    cantidadVentas: cierre.cantidadVentas,
    observaciones: cierre.observaciones,
    cerradoEn: cierre.cerradoEn.toISOString(),
  };
}

/** Serializa cierres y movimientos del mismo día dentro de una transacción. */
export async function bloquearDia(tx: Cliente, fecha: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`caja:${fecha}`}))`;
}

/** "2026-10-02" → "02/10" */
export function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}
