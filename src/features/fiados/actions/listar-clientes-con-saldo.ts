"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { calcularSaldo } from "@/features/fiados/lib/calcular-saldo";
import type { Resultado } from "@/shared/types/resultado";

export type ClienteConSaldo = { id: number; nombre: string; saldo: number };

export async function listarClientesConSaldo(): Promise<Resultado<ClienteConSaldo[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const [clientes, ventas, pagos] = await Promise.all([
      prisma.cliente.findMany({ select: { id: true, nombre: true } }),
      prisma.venta.groupBy({
        by: ["clienteFiadoId", "estadoPago"],
        where: {
          clienteFiadoId: { not: null },
          anulada: false,
          estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] },
        },
        _sum: { total: true },
      }),
      prisma.pago.groupBy({
        by: ["clienteFiadoId"],
        where: { anulado: false },
        _sum: { monto: true },
      }),
    ]);
    const ventasPorCliente = new Map<
      number,
      Array<{ total: number; estadoPago: "FIADA" | "A_COBRAR_HOY"; anulada: boolean }>
    >();
    for (const venta of ventas) {
      if (venta.clienteFiadoId === null || venta.estadoPago === "PAGADA") continue;
      const existentes = ventasPorCliente.get(venta.clienteFiadoId) ?? [];
      existentes.push({
        total: Number(venta._sum.total ?? 0),
        estadoPago: venta.estadoPago,
        anulada: false,
      });
      ventasPorCliente.set(venta.clienteFiadoId, existentes);
    }
    const pagosPorCliente = new Map(
      pagos.map((pago) => [pago.clienteFiadoId, Number(pago._sum.monto ?? 0)]),
    );

    const resultado = clientes
      .map((cliente) => ({
        ...cliente,
        saldo: calcularSaldo(ventasPorCliente.get(cliente.id) ?? [], [
          { monto: pagosPorCliente.get(cliente.id) ?? 0, anulado: false },
        ]),
      }))
      .filter((cliente) => cliente.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo || a.nombre.localeCompare(b.nombre, "es-AR"));
    return ok(resultado);
  } catch (error) {
    console.error("fiados.listarClientesConSaldo", error);
    return fallo("No se pudieron cargar las cuentas con saldo.", "database");
  }
}
