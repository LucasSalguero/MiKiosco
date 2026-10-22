"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import {
  calcularPrecioNuevoCentavos,
  filtrarParaActualizacion,
  validarActualizacionMasiva,
} from "@/features/products/lib/calcular-precios-masivos";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { aCentavos } from "@/shared/lib/moneda";
import { fallo, ok } from "@/shared/lib/resultado";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import type { Resultado } from "@/shared/types/resultado";

const PRECIO_MAXIMO_CENTAVOS = 999_999_999_999;

function leerEsperados(valor: unknown): Map<number, number> | null {
  if (!Array.isArray(valor) || valor.length === 0) return null;
  const esperados = new Map<number, number>();
  for (const item of valor) {
    if (typeof item !== "object" || item === null) return null;
    const { id, precioActual } = item as Record<string, unknown>;
    if (!esIdEnteroValido(id) || typeof precioActual !== "number") return null;
    esperados.set(id, Math.round(precioActual * 100));
  }
  return esperados;
}

/**
 * Aplica un aumento (o rebaja) porcentual a los productos activos que cumplen
 * el filtro, en una sola transacción. Recalcula en el servidor y exige que los
 * productos y precios coincidan con la vista previa que vio el usuario. Las
 * ventas pasadas no cambian porque cada ítem guarda su precio unitario.
 */
export async function actualizarPreciosMasivo(
  datos: unknown,
  vistaPrevia: unknown,
): Promise<Resultado<{ actualizados: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  const validado = validarActualizacionMasiva(datos);
  if (!validado.ok) return validado;
  const esperados = leerEsperados(vistaPrevia);
  if (!esperados) return fallo("Generá la vista previa antes de aplicar.", "validation");
  const { filtro, porcentaje, redondeo } = validado.data;
  const cambiaron = fallo(
    "Los precios cambiaron desde la vista previa. Revisala y volvé a aplicar.",
    "validation",
  );

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Bloquea los productos a modificar para que nadie los edite en el medio.
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Producto" WHERE "id" IN (${Prisma.join([...esperados.keys()])}) FOR UPDATE`,
      );
      const candidatos = await tx.producto.findMany({
        where: { activo: true, ...(filtro.categoria ? { categoria: filtro.categoria } : {}) },
        select: { id: true, precio: true, categoria: true, marca: true, activo: true },
      });
      const alcanzados = filtrarParaActualizacion(candidatos, filtro);

      if (
        alcanzados.length !== esperados.size ||
        alcanzados.some((producto) => esperados.get(producto.id) !== aCentavos(producto.precio))
      ) {
        return cambiaron;
      }

      const nuevos = alcanzados.map((producto) => ({
        id: producto.id,
        centavos: calcularPrecioNuevoCentavos(aCentavos(producto.precio), porcentaje, redondeo),
      }));
      if (nuevos.some((nuevo) => nuevo.centavos > PRECIO_MAXIMO_CENTAVOS)) {
        return fallo("Algún precio nuevo supera el máximo permitido.", "validation");
      }

      for (const nuevo of nuevos) {
        await tx.producto.update({
          where: { id: nuevo.id },
          data: { precio: new Prisma.Decimal(nuevo.centavos).dividedBy(100) },
        });
      }
      return ok({ actualizados: nuevos.length });
    });

    if (resultado.ok) {
      revalidatePath("/");
      revalidatePath("/productos");
    }
    return resultado;
  } catch (error) {
    console.error("products.actualizarPreciosMasivo", error);
    return fallo("No se pudieron actualizar los precios.", "database");
  }
}
