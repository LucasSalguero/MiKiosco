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

const INTENTOS_MAXIMOS = 5;
const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
const DURACION_BLOQUEO_MS = 5 * 60 * 1000;
const intentosPorOrigen = new Map<
  string,
  { cantidad: number; ventanaInicia: number; bloqueadoHasta: number }
>();

function origenDePeticion(valor: string | null): string {
  return valor?.split(",").at(-1)?.trim() || "desconocido";
}

function puedeIntentar(origen: string, ahora: number): boolean {
  for (const [clave, estado] of intentosPorOrigen) {
    if (
      (estado.bloqueadoHasta > 0 && estado.bloqueadoHasta <= ahora) ||
      ahora - estado.ventanaInicia >= VENTANA_INTENTOS_MS
    ) {
      intentosPorOrigen.delete(clave);
    }
  }

  if (intentosPorOrigen.size > 5000) {
    const claveMasAntigua = intentosPorOrigen.keys().next().value;
    if (claveMasAntigua) intentosPorOrigen.delete(claveMasAntigua);
  }

  const estado = intentosPorOrigen.get(origen);
  return !estado || estado.bloqueadoHasta <= ahora;
}

function registrarFallo(origen: string, ahora: number): void {
  const estado = intentosPorOrigen.get(origen);
  const ventanaVigente = estado && ahora - estado.ventanaInicia < VENTANA_INTENTOS_MS;
  const cantidad = ventanaVigente ? estado.cantidad + 1 : 1;

  intentosPorOrigen.set(origen, {
    cantidad,
    ventanaInicia: ventanaVigente ? estado.ventanaInicia : ahora,
    bloqueadoHasta: cantidad >= INTENTOS_MAXIMOS ? ahora + DURACION_BLOQUEO_MS : 0,
  });
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
  const origen = origenDePeticion((await headers()).get("x-forwarded-for"));
  const ahora = Date.now();
  if (!puedeIntentar(origen, ahora)) {
    return fallo(
      "Demasiados intentos. Esperá unos minutos antes de probar de nuevo.",
      "unauthorized",
    );
  }
  if (!verificarPinConfigurado(pin)) {
    registrarFallo(origen, ahora);
    return fallo("El PIN ingresado no es correcto.", "unauthorized");
  }
  intentosPorOrigen.delete(origen);

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
