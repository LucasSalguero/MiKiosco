import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { validarNuevaVenta } from "@/features/sales/lib/validar-venta";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { normalizarNombreCliente } from "@/features/fiados/lib/normalizar-nombre-cliente";

export async function guardarVenta(
  venta: unknown,
  claveOperacion: unknown,
  esReintentoOffline = false,
): Promise<Resultado<{ id: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (
    typeof claveOperacion !== "string" ||
    !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(claveOperacion)
  ) {
    return fallo("El identificador de la venta no es válido.", "validation");
  }

  const validado = validarNuevaVenta(venta, esReintentoOffline);
  if (!validado.ok) return fallo(validado.error, validado.code);

  try {
    const existente = await prisma.venta.findUnique({
      where: { claveOperacion },
      select: { id: true },
    });
    if (existente) return ok({ id: existente.id });

    const { items, fecha, estadoPago } = validado.data;
    const ids = [
      ...new Set(items.flatMap((item) => (item.productoId === null ? [] : [item.productoId]))),
    ];
    const productos = ids.length
      ? await prisma.producto.findMany({
          where: { id: { in: ids } },
          select: { id: true, activo: true },
        })
      : [];
    if (productos.length !== ids.length) {
      return fallo("Hay productos que no existen.", "validation");
    }
    if (!esReintentoOffline && productos.some((producto) => !producto.activo)) {
      return fallo("Hay productos que ya no están disponibles.", "validation");
    }

    const total = calcularTotalVenta(items);
    const nuevaVenta = await prisma.$transaction(async (tx) => {
      const clienteFiado =
        estadoPago === "PAGADA"
          ? null
          : validado.data.clienteFiadoId
            ? await tx.cliente.findUnique({
                where: { id: validado.data.clienteFiadoId },
                select: { id: true, nombre: true },
              })
            : await tx.cliente.upsert({
                where: {
                  nombreNormalizado: normalizarNombreCliente(
                    validado.data.clienteNuevoNombre ?? "",
                  ),
                },
                update: {},
                create: {
                  nombre: validado.data.clienteNuevoNombre ?? "",
                  nombreNormalizado: normalizarNombreCliente(
                    validado.data.clienteNuevoNombre ?? "",
                  ),
                },
                select: { id: true, nombre: true },
              });

      if (estadoPago !== "PAGADA" && !clienteFiado) {
        return null;
      }
      const ventaCreada = await tx.venta.create({
        data: {
          fecha: new Date(fecha),
          total: new Prisma.Decimal(total.toFixed(2)),
          estadoPago,
          clienteFiadoId: clienteFiado?.id,
          clienteNombre: estadoPago === "PAGADA" ? null : (clienteFiado?.nombre ?? null),
          autorizadaPor: validado.data.autorizadaPor ?? null,
          sincronizada: true,
          claveOperacion,
        },
      });
      await tx.ventaItem.createMany({
        data: items.map((item) => ({
          ventaId: ventaCreada.id,
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          cantidad: item.cantidad,
          precioUnitario: new Prisma.Decimal(item.precioUnitario.toFixed(2)),
        })),
      });
      return ventaCreada;
    });

    if (!nuevaVenta) {
      return fallo("No se encontró el cliente seleccionado.", "validation");
    }
    revalidatePath("/");
    revalidatePath("/historial");
    revalidatePath("/fiados");
    return ok({ id: nuevaVenta.id });
  } catch (error) {
    console.error("sales.guardarVenta", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existente = await prisma.venta.findUnique({
        where: { claveOperacion },
        select: { id: true },
      });
      if (existente) return ok({ id: existente.id });
    }
    return fallo("No se pudo registrar la venta.", "database");
  }
}
