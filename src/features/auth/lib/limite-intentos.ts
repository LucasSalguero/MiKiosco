import "server-only";

import { createHmac } from "node:crypto";

import prisma from "@/shared/db/client";

const INTENTOS_MAXIMOS = 5;
const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

export function claveOrigen(origen: string, secreto: string): string {
  return createHmac("sha256", secreto).update(origen).digest("hex");
}

export async function origenEstaBloqueado(origen: string, ahora: Date): Promise<boolean> {
  await prisma.authRateLimit.deleteMany({ where: { expiraEn: { lte: ahora } } });
  const estado = await prisma.authRateLimit.findUnique({
    where: { origen },
    select: { bloqueadoHasta: true },
  });

  return estado?.bloqueadoHasta !== null && estado?.bloqueadoHasta !== undefined
    ? estado.bloqueadoHasta > ahora
    : false;
}

export async function registrarFalloDeOrigen(origen: string, ahora: Date): Promise<void> {
  const finVentana = new Date(ahora.getTime() + VENTANA_INTENTOS_MS);
  const finBloqueo = new Date(ahora.getTime() + DURACION_BLOQUEO_MS);

  await prisma.$executeRaw`
    INSERT INTO "AuthRateLimit" ("origen", "intentos", "ventanaInicia", "bloqueadoHasta", "expiraEn")
    VALUES (${origen}, 1, ${ahora}, NULL, ${finVentana})
    ON CONFLICT ("origen") DO UPDATE SET
      "intentos" = CASE
        WHEN "AuthRateLimit"."expiraEn" <= ${ahora} THEN 1
        WHEN "AuthRateLimit"."bloqueadoHasta" > ${ahora} THEN "AuthRateLimit"."intentos"
        ELSE LEAST("AuthRateLimit"."intentos" + 1, ${INTENTOS_MAXIMOS})
      END,
      "ventanaInicia" = CASE
        WHEN "AuthRateLimit"."expiraEn" <= ${ahora} THEN ${ahora}
        ELSE "AuthRateLimit"."ventanaInicia"
      END,
      "bloqueadoHasta" = CASE
        WHEN "AuthRateLimit"."expiraEn" <= ${ahora} THEN NULL
        WHEN "AuthRateLimit"."bloqueadoHasta" > ${ahora} THEN "AuthRateLimit"."bloqueadoHasta"
        WHEN "AuthRateLimit"."intentos" + 1 >= ${INTENTOS_MAXIMOS} THEN ${finBloqueo}
        ELSE NULL
      END,
      "expiraEn" = CASE
        WHEN "AuthRateLimit"."expiraEn" <= ${ahora} THEN ${finVentana}
        WHEN "AuthRateLimit"."bloqueadoHasta" > ${ahora} THEN "AuthRateLimit"."bloqueadoHasta"
        WHEN "AuthRateLimit"."intentos" + 1 >= ${INTENTOS_MAXIMOS} THEN ${finBloqueo}
        ELSE "AuthRateLimit"."ventanaInicia" + INTERVAL '15 minutes'
      END
  `;
}

export async function limpiarFallasDeOrigen(origen: string): Promise<void> {
  await prisma.authRateLimit.deleteMany({ where: { origen } });
}
