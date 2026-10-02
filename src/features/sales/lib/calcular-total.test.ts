import { describe, expect, it } from "vitest";

import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import type { ItemNuevaVenta } from "@/shared/types/venta";

describe("calcularTotalVenta", () => {
  it("suma importes en centavos sin errores de precisión binaria", () => {
    const items: ItemNuevaVenta[] = [
      { productoId: 1, productoNombre: "Caramelo", cantidad: 3, precioUnitario: 0.1 },
      { productoId: 2, productoNombre: "Galletita", cantidad: 1, precioUnitario: 0.2 },
    ];

    expect(calcularTotalVenta(items)).toBe(0.5);
  });

  it("redondea cada precio a dos decimales antes de multiplicar", () => {
    const items: ItemNuevaVenta[] = [
      { productoId: 1, productoNombre: "Alfajor", cantidad: 3, precioUnitario: 10.235 },
    ];

    expect(calcularTotalVenta(items)).toBe(30.69);
  });
});
