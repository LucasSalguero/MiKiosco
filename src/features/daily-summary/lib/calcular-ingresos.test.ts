import { describe, expect, it } from "vitest";

import { calcularIngresosDelDia } from "@/features/daily-summary/lib/calcular-ingresos";

describe("calcularIngresosDelDia", () => {
  it("excluye los fiados del efectivo hasta que se registra un cobro", () => {
    const ventas = [
      { total: 100, tipoPago: "CONTADO" as const },
      { total: 75.5, tipoPago: "FIADO" as const },
    ];

    expect(calcularIngresosDelDia(ventas, [])).toBe(100);
    expect(calcularIngresosDelDia(ventas, [25.25])).toBe(125.25);
  });
});
