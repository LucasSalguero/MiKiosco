export type PagoIdempotenteExistente = {
  id: number;
  clienteFiadoId: number;
  monto: number;
  medio: string;
  ventaId: number | null;
};

export function resolverPagoIdempotente(
  existente: PagoIdempotenteExistente,
  nuevo: {
    clienteFiadoId: number;
    monto: number;
    medio: string;
    ventaId: number | null;
  },
): "repetido" | "conflicto" {
  const mismoMonto = Math.round(existente.monto * 100) === Math.round(nuevo.monto * 100);
  return existente.clienteFiadoId === nuevo.clienteFiadoId &&
    mismoMonto &&
    existente.medio === nuevo.medio &&
    existente.ventaId === nuevo.ventaId
    ? "repetido"
    : "conflicto";
}
