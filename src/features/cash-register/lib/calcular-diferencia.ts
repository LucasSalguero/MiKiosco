import type { EstadoDiferencia } from "@/shared/types/caja";

/** Diferencia entre lo contado y lo esperado, en centavos. Negativa = faltante. */
export function calcularDiferencia(
  efectivoContadoCentavos: number,
  efectivoEsperadoCentavos: number,
): { diferencia: number; estado: EstadoDiferencia } {
  const diferencia = efectivoContadoCentavos - efectivoEsperadoCentavos;
  return {
    diferencia,
    estado: diferencia === 0 ? "exacto" : diferencia < 0 ? "faltante" : "sobrante",
  };
}
