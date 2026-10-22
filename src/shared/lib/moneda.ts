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

/** Valor monetario tal como llega de Prisma (Decimal), de un string o de un número. */
export type MontoDecimal = { toString: () => string } | number | string;

/** Convierte un importe con hasta 2 decimales a centavos enteros, sin depender de Prisma. */
export function aCentavos(valor: MontoDecimal): number {
  const numero = typeof valor === "number" ? valor : Number(valor.toString());
  if (!Number.isFinite(numero)) return 0;
  return Math.round((numero + (numero < 0 ? -Number.EPSILON : Number.EPSILON)) * 100);
}
