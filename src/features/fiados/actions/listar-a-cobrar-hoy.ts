"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import { decimalANumero } from "@/shared/lib/moneda";
import type { Resultado } from "@/shared/types/resultado";
import { calcularSaldosVentas } from "@/features/fiados/lib/calcular-saldos-ventas";

export type VentaACobrarHoy = {
  id: number;
  clienteFiadoId: number;
  cliente: string;
  fecha: string;
  total: number;
  saldo: number;
};

export async function listarACobrarHoy(): Promise<Resultado<VentaACobrarHoy[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const { desde, hasta } = rangoDelDia(hoyISO());
    const ventas = await prisma.venta.findMany({
      where: {
        estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] },
        anulada: false,
        clienteFiadoId: { not: null },
      },
      include: {
        clienteFiado: { select: { nombre: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
    });
    const clienteIds = [...new Set(ventas.flatMap((venta) => venta.clienteFiadoId ?? []))];
    const pagosGenerales = clienteIds.length
      ? await prisma.pago.findMany({
          where: { clienteFiadoId: { in: clienteIds }, ventaId: null, anulado: false },
          select: { clienteFiadoId: true, monto: true },
        })
      : [];
    const ventasPorCliente = new Map<number, typeof ventas>();
    for (const venta of ventas) {
      if (venta.clienteFiadoId === null) continue;
      const delCliente = ventasPorCliente.get(venta.clienteFiadoId) ?? [];
      delCliente.push(venta);
      ventasPorCliente.set(venta.clienteFiadoId, delCliente);
    }
    const pagosPorCliente = new Map<number, typeof pagosGenerales>();
    for (const pago of pagosGenerales) {
      const delCliente = pagosPorCliente.get(pago.clienteFiadoId) ?? [];
      delCliente.push(pago);
      pagosPorCliente.set(pago.clienteFiadoId, delCliente);
    }

    const saldosPorVenta = new Map<number, number>();
    for (const [clienteId, ventasCliente] of ventasPorCliente) {
      const saldos = calcularSaldosVentas(
        ventasCliente.map((venta) => ({
          id: venta.id,
          fecha: venta.fecha,
          total: venta.total,
          pagosAsociados: venta.pagos.map((pago) => pago.monto),
        })),
        (pagosPorCliente.get(clienteId) ?? []).map((pago) => pago.monto),
      );
      for (const [ventaId, saldo] of saldos) saldosPorVenta.set(ventaId, saldo);
    }

    return ok(
      ventas
        .filter(
          (venta) =>
            venta.estadoPago === "A_COBRAR_HOY" && venta.fecha >= desde && venta.fecha < hasta,
        )
        .flatMap((venta) => {
          if (venta.clienteFiadoId === null) return [];
          const saldo = saldosPorVenta.get(venta.id) ?? 0;
          if (saldo <= 0) return [];
          return [
            {
              id: venta.id,
              clienteFiadoId: venta.clienteFiadoId,
              cliente: venta.clienteFiado?.nombre ?? venta.clienteNombre ?? "Cliente",
              fecha: venta.fecha.toISOString(),
              total: decimalANumero(venta.total),
              saldo,
            },
          ];
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    );
  } catch (error) {
    console.error("fiados.listarACobrarHoy", error);
    return fallo("No se pudieron cargar las ventas por cobrar hoy.", "database");
  }
}
