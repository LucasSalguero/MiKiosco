"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { bloquearDia } from "@/features/cash-register/lib/cargar-dia";
import {
  esClaveOperacion,
  resolverMovimientoIdempotente,
  validarMovimientoCaja,
} from "@/features/cash-register/lib/validar-caja";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO } from "@/shared/lib/fechas";
import { aCentavos } from "@/shared/lib/moneda";
import { fallo, ok } from "@/shared/lib/resultado";
import type { MovimientoCaja } from "@/shared/types/caja";
import type { Resultado } from "@/shared/types/resultado";

type MovimientoPersistido = {
  id: number;
  fecha: Date;
  tipo: MovimientoCaja["tipo"];
  monto: Prisma.Decimal;
  motivo: string;
  anulado: boolean;
};

function mapear(movimiento: MovimientoPersistido): MovimientoCaja {
  return {
    id: movimiento.id,
    fecha: movimiento.fecha.toISOString(),
    tipo: movimiento.tipo,
    monto: aCentavos(movimiento.monto) / 100,
    motivo: movimiento.motivo,
    anulado: movimiento.anulado,
  };
}

/**
 * Registra un egreso, retiro o ingreso de efectivo en el día de hoy. Es
 * idempotente: reintentar con la misma clave devuelve el mismo movimiento.
 */
export async function registrarMovimientoCaja(
  tipo: unknown,
  monto: unknown,
  motivo: unknown,
  claveOperacion: unknown,
): Promise<Resultado<MovimientoCaja>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  const validado = validarMovimientoCaja(tipo, monto, motivo);
  if (!validado.ok) return validado;
  if (!esClaveOperacion(claveOperacion)) {
    return fallo("La clave del movimiento no es válida.", "validation");
  }
  const nuevo = validado.data;

  const resolverExistente = (existente: MovimientoPersistido): Resultado<MovimientoCaja> =>
    resolverMovimientoIdempotente(
      { ...existente, montoCentavos: aCentavos(existente.monto) },
      nuevo,
    ) === "repetido"
      ? ok(mapear(existente))
      : fallo("La clave de operación ya se usó para otro movimiento.", "validation");

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const existente = await tx.movimientoCaja.findUnique({ where: { claveOperacion } });
      if (existente) return resolverExistente(existente);

      const hoy = hoyISO();
      await bloquearDia(tx, hoy);
      const cierre = await tx.cierreCaja.findUnique({
        where: { fecha: hoy },
        select: { id: true },
      });
      if (cierre) {
        return fallo(
          "La caja de hoy ya está cerrada. No se pueden sumar movimientos.",
          "validation",
        );
      }

      const creado = await tx.movimientoCaja.create({
        data: {
          tipo: nuevo.tipo,
          monto: new Prisma.Decimal(nuevo.montoCentavos).dividedBy(100),
          motivo: nuevo.motivo,
          claveOperacion,
        },
      });
      return ok(mapear(creado));
    });
    if (resultado.ok) revalidatePath("/caja");
    return resultado;
  } catch (error) {
    console.error("cash-register.registrarMovimientoCaja", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existente = await prisma.movimientoCaja.findUnique({ where: { claveOperacion } });
      if (existente) return resolverExistente(existente);
    }
    return fallo("No se pudo registrar el movimiento.", "database");
  }
}
