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
        const venta = await tx.venta.findUnique({
          where: { id: ventaId },
          select: { clienteFiadoId: true, estadoPago: true, anulada: true, total: true },
        });
        if (
          !venta ||
          venta.clienteFiadoId !== clienteFiadoId ||
          venta.anulada ||
          venta.estadoPago === "PAGADA"
        ) {
          return fallo("La venta ya no tiene un saldo fiado.", "validation");
        }
        const pagosVenta = await tx.pago.aggregate({
          where: { ventaId, anulado: false },
          _sum: { monto: true },
        });
        const restanteVenta = new Prisma.Decimal(venta.total)
          .minus(pagosVenta._sum.monto ?? 0)
          .toDecimalPlaces(2)
          .toNumber();
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
    const pagosVenta = await prisma.pago.aggregate({
      where: { ventaId, anulado: false },
      _sum: { monto: true },
    });
    const restante = new Prisma.Decimal(venta.total)
      .minus(pagosVenta._sum.monto ?? 0)
      .toDecimalPlaces(2)
      .toNumber();
    if (restante <= 0) return fallo("Esta venta ya está cobrada.", "validation");

    return registrarPago(venta.clienteFiadoId, restante, medio, claveOperacion, ventaId);
  } catch (error) {
    console.error("fiados.cobrarVentaPuntual", error);
    return fallo("No se pudo marcar la venta como cobrada.", "database");
  }
}
