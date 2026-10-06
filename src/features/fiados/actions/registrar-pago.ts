"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import { redondearMonto } from "@/shared/lib/moneda";
import { obtenerSaldoCliente } from "@/features/fiados/lib/obtener-saldo-cliente";
import { resolverPagoIdempotente } from "@/features/fiados/lib/resolver-pago-idempotente";
import { calcularSaldosVentas } from "@/features/fiados/lib/calcular-saldos-ventas";
import type { MedioPago } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";

const esClaveOperacion = (valor: unknown): valor is string =>
  typeof valor === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(valor);

function revalidarFiados(): void {
  revalidatePath("/");
  revalidatePath("/fiados");
  revalidatePath("/historial");
}

export async function registrarPago(
  clienteFiadoId: unknown,
  monto: unknown,
  medio: unknown,
  claveOperacion: unknown,
  ventaId?: unknown,
): Promise<Resultado<{ id: number; saldo: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(clienteFiadoId)) return fallo("El cliente seleccionado no es válido.");
  if (
    typeof monto !== "number" ||
    !Number.isFinite(monto) ||
    monto <= 0 ||
    monto > 9_999_999_999.99 ||
    !Number.isSafeInteger(Math.round(monto * 100))
  ) {
    return fallo("Ingresá un importe de pago válido.", "validation");
  }
  if (medio !== "EFECTIVO" && medio !== "TRANSFERENCIA") {
    return fallo("Elegí efectivo o transferencia como medio de pago.", "validation");
  }
  if (!esClaveOperacion(claveOperacion)) {
    return fallo("La clave del pago no es válida.", "validation");
  }
  if (ventaId !== undefined && ventaId !== null && !esIdEnteroValido(ventaId)) {
    return fallo("La venta seleccionada no es válida.", "validation");
  }

  const importe = redondearMonto(monto);
  const medioPago: MedioPago = medio;
  if (importe <= 0) return fallo("El importe de pago debe ser mayor a cero.", "validation");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Cliente" WHERE "id" = ${clienteFiadoId} FOR UPDATE`,
      );
      const existente = await tx.pago.findUnique({
        where: { claveOperacion },
        select: { id: true, clienteFiadoId: true, monto: true, medio: true, ventaId: true },
      });
      if (existente) {
        if (
          resolverPagoIdempotente(
            {
              ...existente,
              monto: Number(existente.monto),
            },
            { clienteFiadoId, monto: importe, medio, ventaId: ventaId ?? null },
          ) === "conflicto"
        ) {
          return fallo("La clave de operación ya se usó para otro pago.", "validation");
        }
        return ok({ id: existente.id, saldo: await obtenerSaldoCliente(tx, clienteFiadoId) });
      }

      const saldoActual = await obtenerSaldoCliente(tx, clienteFiadoId);
      if (new Prisma.Decimal(importe).greaterThan(new Prisma.Decimal(saldoActual))) {
        return fallo("El pago no puede superar el saldo pendiente del cliente.", "validation");
      }

      if (typeof ventaId === "number") {
        const ventasCliente = await tx.venta.findMany({
          where: {
            clienteFiadoId,
            anulada: false,
            estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] },
          },
          select: {
            id: true,
            fecha: true,
            total: true,
            pagos: { where: { anulado: false }, select: { monto: true } },
          },
        });
        const venta = ventasCliente.find((item) => item.id === ventaId);
        if (!venta) {
          return fallo("La venta ya no tiene un saldo fiado.", "validation");
        }
        const pagosGenerales = await tx.pago.findMany({
          where: { clienteFiadoId, ventaId: null, anulado: false },
          select: { monto: true },
        });
        const saldosPorVenta = calcularSaldosVentas(
          ventasCliente.map((item) => ({
            id: item.id,
            fecha: item.fecha,
            total: item.total,
            pagosAsociados: item.pagos.map((pago) => pago.monto),
          })),
          pagosGenerales.map((pago) => pago.monto),
        );
        const restanteVenta = saldosPorVenta.get(ventaId) ?? 0;
        if (importe > restanteVenta) {
          return fallo("El pago supera el saldo pendiente de esa venta.", "validation");
        }
      }

      const pago = await tx.pago.create({
        data: {
          clienteFiadoId,
          ventaId: typeof ventaId === "number" ? ventaId : null,
          monto: new Prisma.Decimal(importe.toFixed(2)),
          medio: medioPago,
          claveOperacion,
        },
      });
      return ok({
        id: pago.id,
        saldo: await obtenerSaldoCliente(tx, clienteFiadoId),
      });
    });
    if (!resultado.ok) return resultado;
    revalidarFiados();
    return resultado;
  } catch (error) {
    console.error("fiados.registrarPago", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existente = await prisma.pago.findUnique({
        where: { claveOperacion },
        select: { id: true, clienteFiadoId: true, monto: true, medio: true, ventaId: true },
      });
      if (
        existente &&
        resolverPagoIdempotente(
          { ...existente, monto: Number(existente.monto) },
          { clienteFiadoId, monto: importe, medio, ventaId: ventaId ?? null },
        ) === "repetido"
      ) {
        return ok({
          id: existente.id,
          saldo: await obtenerSaldoCliente(prisma, clienteFiadoId),
        });
      }
    }
    return fallo("No se pudo registrar el pago.", "database");
  }
}

export async function cobrarVentaPuntual(
  ventaId: unknown,
  medio: unknown,
  claveOperacion: unknown,
): Promise<Resultado<{ id: number; saldo: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(ventaId)) return fallo("La venta seleccionada no es válida.");
  if (!esClaveOperacion(claveOperacion)) return fallo("La clave del pago no es válida.");
  if (medio !== "EFECTIVO" && medio !== "TRANSFERENCIA") {
    return fallo("Elegí efectivo o transferencia como medio de pago.", "validation");
  }

  try {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      select: { clienteFiadoId: true, anulada: true, estadoPago: true, total: true },
    });
    if (!venta || venta.clienteFiadoId === null || venta.anulada || venta.estadoPago === "PAGADA") {
      return fallo("La venta ya no tiene un saldo fiado.", "validation");
    }
    const [ventasCliente, pagosGenerales] = await Promise.all([
      prisma.venta.findMany({
        where: {
          clienteFiadoId: venta.clienteFiadoId,
          anulada: false,
          estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] },
        },
        select: {
          id: true,
          fecha: true,
          total: true,
          pagos: { where: { anulado: false }, select: { monto: true } },
        },
      }),
      prisma.pago.findMany({
        where: { clienteFiadoId: venta.clienteFiadoId, ventaId: null, anulado: false },
        select: { monto: true },
      }),
    ]);
    const saldosPorVenta = calcularSaldosVentas(
      ventasCliente.map((item) => ({
        id: item.id,
        fecha: item.fecha,
        total: item.total,
        pagosAsociados: item.pagos.map((pago) => pago.monto),
      })),
      pagosGenerales.map((pago) => pago.monto),
    );
    const restante = saldosPorVenta.get(ventaId) ?? 0;
    if (restante <= 0) return fallo("Esta venta ya está cobrada.", "validation");

    return registrarPago(venta.clienteFiadoId, restante, medio, claveOperacion, ventaId);
  } catch (error) {
    console.error("fiados.cobrarVentaPuntual", error);
    return fallo("No se pudo marcar la venta como cobrada.", "database");
  }
}
