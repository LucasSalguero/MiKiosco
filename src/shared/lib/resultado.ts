import type { Resultado } from "@/shared/types/resultado";

export function ok<T>(data: T): Resultado<T> {
  return { ok: true, data };
}

export function fallo(error: string): Resultado<never> {
  return { ok: false, error };
}
