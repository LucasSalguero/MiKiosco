"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { calcularDiferencia } from "@/features/cash-register/lib/calcular-diferencia";
import {
  bloquearDia,
  cargarDia,
  fechaCorta,
  mapearCierre,
} from "@/features/cash-register/lib/cargar-dia";
import { validarCierreCaja } from "@/features/cash-register/lib/validar-caja";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO } from "@/shared/lib/fechas";
import { fallo, ok } from "@/shared/lib/resultado";
import type { CierreCaja } from "@/shared/types/caja";
import type { Resultado } from "@/shared/types/resultado";

const decimal = (centavos: number) => new Prisma.Decimal(centavos).dividedBy(100);

/**
 * Guarda la foto del arqueo. Todos los totales se recalculan acá: del cliente
 * solo se toman la fecha, el fondo inicial, el efectivo contado y las notas.
 */
export async function cerrarCaja(datos: unknown): Promise<Resultado<CierreCaja>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  const validado = validarCierreCaja(datos, hoyISO());
  if (!validado.ok) return validado;
  const { fecha, fondoInicialCentavos, efectivoContadoCentavos, observaciones } = validado.data;
  const yaCerrada = fallo(`La caja del ${fechaCorta(fecha)} ya está cerrada.`, "validation");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      await bloquearDia(tx, fecha);
      const existente = await tx.cierreCaja.findUnique({ where: { fecha }, select: { id: true } });
      if (existente) return yaCerrada;

      const { arqueo } = await cargarDia(tx, fecha, fondoInicialCentavos);
      const { diferencia } = calcularDiferencia(efectivoContadoCentavos, arqueo.efectivoEsperado);
      const cierre = await tx.cierreCaja.create({
        data: {
          fecha,
          fondoInicial: decimal(fondoInicialCentavos),
          efectivoEsperado: decimal(arqueo.efectivoEsperado),
          efectivoContado: decimal(efectivoContadoCentavos),
          diferencia: decimal(diferencia),
          totalVendido: decimal(arqueo.vendido),
          totalCobrado: decimal(arqueo.cobrado),
          totalEfectivo: decimal(arqueo.cobradoEfectivo),
          totalTransfer: decimal(arqueo.cobradoTransferencia),
          totalDesconocido: decimal(arqueo.cobradoDesconocido),
          fiadoNuevo: decimal(arqueo.fiadoNuevo),
          totalEgresos: decimal(arqueo.egresos),
          totalRetiros: decimal(arqueo.retiros),
          totalIngresos: decimal(arqueo.ingresos),
          cantidadVentas: arqueo.cantidadVentas,
          observaciones,
        },
      });
      return ok(mapearCierre(cierre));
    });
    if (resultado.ok) revalidatePath("/caja");
    return resultado;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return yaCerrada;
    }
    console.error("cash-register.cerrarCaja", error);
    return fallo("No se pudo cerrar la caja.", "database");
  }
}
