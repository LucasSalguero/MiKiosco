"use server";

import { cookies, headers } from "next/headers";

import {
  COOKIE_SESION,
  crearTokenSesion,
  DURACION_SESION_SEGUNDOS,
  validarPin,
  verificarPinConfigurado,
} from "@/shared/lib/autenticacion";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import { esHashPinValido } from "@/features/auth/lib/hash-pin";
import {
  claveOrigen,
  limpiarFallasDeOrigen,
  origenEstaBloqueado,
  registrarFalloDeOrigen,
} from "@/features/auth/lib/limite-intentos";

function origenDePeticion(valor: string | null): string {
  return valor?.split(",").at(-1)?.trim() || "desconocido";
}

export async function desbloquear(pin: unknown): Promise<Resultado<boolean>> {
  if (!validarPin(pin))
    return fallo("Ingresá un PIN numérico válido de 6 a 12 dígitos.", "validation");
  if (!process.env.AUTH_PIN_HASH?.trim()) {
    console.error("auth.desbloquear", "Falta configurar AUTH_PIN_HASH.");
    return fallo("Falta configurar AUTH_PIN_HASH en el servidor.", "unknown");
  }
  if (!esHashPinValido(process.env.AUTH_PIN_HASH.trim())) {
    console.error("auth.desbloquear", "AUTH_PIN_HASH tiene un formato inválido.");
    return fallo(
      "AUTH_PIN_HASH no tiene un formato válido. Generá un hash nuevo con npm run auth:hash-pin.",
      "unknown",
    );
  }
  if (!process.env.AUTH_SESSION_SECRET || process.env.AUTH_SESSION_SECRET.length < 32) {
    console.error("auth.desbloquear", "AUTH_SESSION_SECRET falta o tiene menos de 32 caracteres.");
    return fallo("Falta configurar AUTH_SESSION_SECRET en el servidor.", "unknown");
  }
  const origen = claveOrigen(
    origenDePeticion((await headers()).get("x-forwarded-for")),
    process.env.AUTH_SESSION_SECRET,
  );
  try {
    const ahora = new Date();
    if (await origenEstaBloqueado(origen, ahora)) {
      return fallo(
        "Demasiados intentos. Esperá unos minutos antes de probar de nuevo.",
        "unauthorized",
      );
    }
    if (!verificarPinConfigurado(pin)) {
      await registrarFalloDeOrigen(origen, ahora);
      return fallo("El PIN ingresado no es correcto.", "unauthorized");
    }
    await limpiarFallasDeOrigen(origen);
  } catch (error) {
    console.error("auth.desbloquear.rateLimit", error);
    return fallo("No se pudo validar el acceso. Reintentá en unos instantes.", "database");
  }

  const token = crearTokenSesion();
  if (!token) {
    console.error("auth.desbloquear", "AUTH_SESSION_SECRET debe tener al menos 32 caracteres.");
    return fallo("La autenticación no está configurada correctamente.", "unknown");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
  return ok(true);
}
