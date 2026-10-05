import { afterEach, describe, expect, it, vi } from "vitest";

import { validarNuevaVenta } from "@/features/sales/lib/validar-venta";
import type { NuevaVenta } from "@/shared/types/venta";

const ventaBase: NuevaVenta = {
  fecha: "2026-10-02T12:00:00.000Z",
  items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 10.235 }],
};

describe("validarNuevaVenta", () => {
  afterEach(() => vi.useRealTimers());

  it("acepta una venta válida y normaliza los precios a dos decimales", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00.000Z"));

    expect(validarNuevaVenta(ventaBase)).toEqual({
      ok: true,
      data: {
        fecha: ventaBase.fecha,
        items: [{ ...ventaBase.items[0], precioUnitario: 10.23 }],
        tipoPago: "CONTADO",
      },
    });
  });

  it.each([
    [{ ...ventaBase, items: [] }, "La venta debe incluir al menos un producto."],
    [
      { ...ventaBase, items: [{ ...ventaBase.items[0], cantidad: 0 }] },
      "Las cantidades deben ser números enteros mayores a cero.",
    ],
    [
      { ...ventaBase, items: [{ ...ventaBase.items[0], precioUnitario: -1 }] },
      "El precio unitario no es válido.",
    ],
    [
      { ...ventaBase, items: [{ ...ventaBase.items[0], productoId: 0 }] },
      "El producto es inválido.",
    ],
  ] as [NuevaVenta, string][])("rechaza datos inválidos", (venta, mensaje) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00.000Z"));

    expect(validarNuevaVenta(venta).ok).toBe(false);
    expect(validarNuevaVenta(venta)).toMatchObject({ ok: false, error: mensaje });
  });

  it("rechaza fechas inválidas y futuras fuera de tolerancia", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00.000Z"));

    expect(validarNuevaVenta({ ...ventaBase, fecha: "no-es-fecha" })).toMatchObject({
      ok: false,
      error: "La fecha de la venta es inválida.",
    });
    expect(validarNuevaVenta({ ...ventaBase, fecha: "2026-10-02T12:06:00.000Z" })).toMatchObject({
      ok: false,
      error: "La fecha de la venta no puede ser futura.",
    });
  });

  it("rechaza payloads ausentes o elementos que no son objetos", () => {
    expect(validarNuevaVenta(null).ok).toBe(false);
    expect(validarNuevaVenta({ fecha: ventaBase.fecha, items: [null] })).toMatchObject({
      ok: false,
      error: "Hay un producto inválido en la venta.",
    });
  });

  it("acepta conceptos libres y requiere cliente para registrar un fiado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00.000Z"));
    const conceptoLibre = {
      fecha: ventaBase.fecha,
      items: [
        { productoId: null, productoNombre: "Golosinas varias", cantidad: 1, precioUnitario: 50 },
      ],
    };

    expect(validarNuevaVenta(conceptoLibre)).toMatchObject({
      ok: true,
      data: { items: [{ productoId: null, productoNombre: "Golosinas varias" }] },
    });
    expect(validarNuevaVenta({ ...conceptoLibre, tipoPago: "FIADO" })).toMatchObject({
      ok: false,
      error: "Ingresá el nombre del cliente para registrar el fiado.",
    });
    expect(
      validarNuevaVenta({ ...conceptoLibre, tipoPago: "FIADO", clienteNombre: " Ana " }),
    ).toMatchObject({ ok: true, data: { tipoPago: "FIADO", clienteNombre: "Ana" } });
  });
});
