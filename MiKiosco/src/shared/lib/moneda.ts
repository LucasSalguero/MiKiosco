import type { Prisma } from "@prisma/client";

export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

export function decimalANumero(valor: Prisma.Decimal): number {
  return Number(valor.toString());
}

export function redondearMonto(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
