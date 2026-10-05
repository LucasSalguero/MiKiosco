import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verificarHashPin } from "@/features/auth/lib/hash-pin";

export const COOKIE_SESION = "mi-kiosco-session";
export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;

function obtenerSecretoSesion(): string | null {
  const secreto = process.env.AUTH_SESSION_SECRET;
  return secreto && secreto.length >= 32 ? secreto : null;
}

function firma(expiracion: string, secreto: string): Buffer {
  return createHmac("sha256", secreto).update(expiracion).digest();
}

export function crearTokenSesion(ahora = Date.now()): string | null {
  const secreto = obtenerSecretoSesion();
  if (!secreto) return null;

  const expiracion = String(Math.floor(ahora / 1000) + DURACION_SESION_SEGUNDOS);
  return `${expiracion}.${firma(expiracion, secreto).toString("base64url")}`;
}

export function verificarTokenSesion(token: string | undefined, ahora = Date.now()): boolean {
  const secreto = obtenerSecretoSesion();
  if (!secreto || !token) return false;

  const [expiracion, firmaCodificada, extra] = token.split(".");
  if (
    extra !== undefined ||
    !/^\d{10,}$/.test(expiracion ?? "") ||
    !firmaCodificada ||
    Number(expiracion) <= Math.floor(ahora / 1000)
  ) {
    return false;
  }

  try {
    const recibida = Buffer.from(firmaCodificada, "base64url");
    const esperada = firma(expiracion, secreto);
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  } catch {
    return false;
  }
}

export function validarPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6,12}$/.test(pin);
}

export function verificarPinConfigurado(pin: string): boolean {
  return verificarHashPin(pin, process.env.AUTH_PIN_HASH?.trim());
}

export async function tieneSesionValida(): Promise<boolean> {
  const cookieStore = await cookies();
  return verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value);
}
