import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PARAMETROS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const LONGITUD_HASH = 64;

export function esHashPinValido(hashConfigurado: string | undefined): hashConfigurado is string {
  if (!hashConfigurado) return false;
  const partes = hashConfigurado.split(":");
  if (partes.length !== 3 || partes[0] !== "scrypt-v1") return false;

  try {
    const sal = Buffer.from(partes[1], "base64url");
    const hash = Buffer.from(partes[2], "base64url");
    return (
      sal.length === 16 &&
      hash.length === LONGITUD_HASH &&
      sal.toString("base64url") === partes[1] &&
      hash.toString("base64url") === partes[2]
    );
  } catch {
    return false;
  }
}

export function crearHashPin(pin: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(pin, sal, LONGITUD_HASH, PARAMETROS);
  return `scrypt-v1:${sal.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verificarHashPin(pin: string, hashConfigurado: string | undefined): boolean {
  if (!esHashPinValido(hashConfigurado)) return false;

  const [, salCodificada, hashCodificado] = hashConfigurado.split(":");
  const sal = Buffer.from(salCodificada, "base64url");
  const esperado = Buffer.from(hashCodificado, "base64url");
  const derivado = scryptSync(pin, sal, esperado.length, PARAMETROS);
  return timingSafeEqual(derivado, esperado);
}
