export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

export function decimalANumero(valor: { toString: () => string }): number {
  return Number(valor.toString());
}

export function redondearMonto(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatearCantidad(cantidad: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(cantidad);
}
