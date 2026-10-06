import assert from "node:assert/strict";
import test from "node:test";

import { validarNuevaVenta } from "@/features/sales/lib/validar-venta";
import type { NuevaVenta } from "@/shared/types/venta";

const ventaBase: NuevaVenta = {
  fecha: "2026-10-02T12:00:00.000Z",
  items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 10.235 }],
};

function conAhora<T>(fecha: string, accion: () => T): T {
  const ahoraOriginal = Date.now;
  Date.now = () => new Date(fecha).getTime();
  try {
    return accion();
  } finally {
    Date.now = ahoraOriginal;
  }
}

test("validarNuevaVenta acepta ventas válidas y redondea precios", () => {
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(ventaBase));

  assert.deepEqual(resultado, {
    ok: true,
    data: {
      fecha: ventaBase.fecha,
      items: [{ ...ventaBase.items[0], precioUnitario: 10.24 }],
      estadoPago: "PAGADA",
    },
  });
});

test("validarNuevaVenta rechaza productos y cantidades inválidos", () => {
  const casos: unknown[] = [
    { ...ventaBase, items: [] },
    { ...ventaBase, items: [{ ...ventaBase.items[0], cantidad: 0 }] },
    { ...ventaBase, items: [{ ...ventaBase.items[0], precioUnitario: -1 }] },
    { ...ventaBase, items: [{ ...ventaBase.items[0], productoId: 0 }] },
  ];

  for (const venta of casos) {
    const resultado = conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(venta));
    assert.equal(resultado.ok, false);
  }
});

test("validarNuevaVenta rechaza fechas inválidas y futuras", () => {
  assert.deepEqual(
    conAhora("2026-10-02T12:00:00.000Z", () =>
      validarNuevaVenta({ ...ventaBase, fecha: "no-es-fecha" }),
    ),
    { ok: false, error: "La fecha de la venta es inválida.", code: "validation" },
  );
  assert.deepEqual(
    conAhora("2026-10-02T12:00:00.000Z", () =>
      validarNuevaVenta({ ...ventaBase, fecha: "2026-10-02T12:06:00.000Z" }),
    ),
    { ok: false, error: "La fecha de la venta no puede ser futura.", code: "validation" },
  );
});

test("validarNuevaVenta acepta conceptos libres y reconoce ventas offline antiguas", () => {
  const conceptoLibre = {
    fecha: ventaBase.fecha,
    items: [
      { productoId: null, productoNombre: "Golosinas varias", cantidad: 1, precioUnitario: 50 },
    ],
  };
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(conceptoLibre));
  assert.equal(resultado.ok, true);

  const legado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta({ ...conceptoLibre, tipoPago: "FIADO", clienteNombre: " Ana " }, true),
  );
  assert.equal(
    conAhora("2026-10-02T12:00:00.000Z", () =>
      validarNuevaVenta({ ...conceptoLibre, tipoPago: "FIADO", clienteNombre: "Ana" }),
    ).ok,
    false,
  );
  assert.deepEqual(legado, {
    ok: true,
    data: {
      fecha: ventaBase.fecha,
      items: [
        { productoId: null, productoNombre: "Golosinas varias", cantidad: 1, precioUnitario: 50 },
      ],
      estadoPago: "FIADA",
      clienteNuevoNombre: "Ana",
      autorizadaPor: "",
      autorizacionConfirmada: true,
    },
  });
});

test("validarNuevaVenta rechaza combinaciones de cliente y estado inválidas", () => {
  const casos: unknown[] = [
    { ...ventaBase, estadoPago: "A_COBRAR_HOY" },
    { ...ventaBase, estadoPago: "PAGADA", clienteFiadoId: 1 },
    {
      ...ventaBase,
      estadoPago: "A_COBRAR_HOY",
      clienteFiadoId: 1,
      clienteNuevoNombre: "Ana",
    },
    {
      ...ventaBase,
      estadoPago: "A_COBRAR_HOY",
      clienteFiadoId: 1,
      autorizadaPor: "Dueño",
    },
    {
      ...ventaBase,
      estadoPago: "A_COBRAR_HOY",
      clienteFiadoId: 1,
      autorizacionConfirmada: false,
    },
    {
      ...ventaBase,
      estadoPago: "FIADA",
      clienteNuevoNombre: "Ana",
      autorizacionConfirmada: false,
    },
    {
      ...ventaBase,
      items: [
        { productoId: 1, productoNombre: "Alfajor", cantidad: 1, precioUnitario: 10_000_000_000 },
      ],
    },
  ];

  for (const venta of casos) {
    const resultado = conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(venta));
    assert.equal(resultado.ok, false);
  }
});

test("validarNuevaVenta acepta cuenta mensual solo con confirmación explícita", () => {
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta({
      ...ventaBase,
      estadoPago: "FIADA",
      clienteNuevoNombre: " Ana ",
      autorizadaPor: " Lucas ",
      autorizacionConfirmada: true,
    }),
  );

  assert.deepEqual(resultado, {
    ok: true,
    data: {
      ...ventaBase,
      estadoPago: "FIADA",
      clienteNuevoNombre: "Ana",
      autorizadaPor: "Lucas",
      autorizacionConfirmada: true,
      items: [{ ...ventaBase.items[0], precioUnitario: 10.24 }],
    },
  });
});
