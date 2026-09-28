import type { CodigoErrorResultado, Resultado } from "@/shared/types/resultado";

export function ok<T>(data: T): Resultado<T> {
  return { ok: true, data };
}

export function fallo(error: string, code: CodigoErrorResultado = "unknown"): Resultado<never> {
  return { ok: false, code, error };
}
