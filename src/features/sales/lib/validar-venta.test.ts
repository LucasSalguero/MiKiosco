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
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta({ ...ventaBase, medioPago: "EFECTIVO" }),
  );

  assert.deepEqual(resultado, {
    ok: true,
    data: {
      fecha: ventaBase.fecha,
      items: [{ ...ventaBase.items[0], precioUnitario: 10.24 }],
      estadoPago: "PAGADA",
      medioPago: "EFECTIVO",
    },
  });
});

test("validarNuevaVenta exige efectivo o transferencia en una venta pagada", () => {
  const validar = (venta: unknown, esReintentoOffline = false) =>
    conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(venta, esReintentoOffline));

  const transferencia = validar({ ...ventaBase, estadoPago: "PAGADA", medioPago: "TRANSFERENCIA" });
  assert.equal(transferencia.ok && transferencia.data.medioPago, "TRANSFERENCIA");

  const sinMedio = validar(ventaBase);
  assert.equal(sinMedio.ok, false);
  assert.equal(!sinMedio.ok && sinMedio.code, "validation");

  for (const medioPago of ["DESCONOCIDO", "TARJETA", "", 1, null]) {
    assert.equal(validar({ ...ventaBase, medioPago }).ok, false, `medio ${String(medioPago)}`);
    assert.equal(
      validar({ ...ventaBase, medioPago }, true).ok,
      false,
      `offline ${String(medioPago)}`,
    );
  }
});

test("validarNuevaVenta rechaza medio de pago en ventas fiadas o a cobrar hoy", () => {
  const casos: unknown[] = [
    { ...ventaBase, estadoPago: "A_COBRAR_HOY", clienteFiadoId: 1, medioPago: "EFECTIVO" },
    {
      ...ventaBase,
      estadoPago: "FIADA",
      clienteFiadoId: 1,
      autorizacionConfirmada: true,
      medioPago: "TRANSFERENCIA",
    },
  ];
  for (const venta of casos) {
    const resultado = conAhora("2026-10-02T12:00:00.000Z", () => validarNuevaVenta(venta, true));
    assert.equal(resultado.ok, false);
  }

  const fiada = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta({ ...ventaBase, estadoPago: "A_COBRAR_HOY", clienteFiadoId: 1 }),
  );
  assert.equal(fiada.ok, true);
  assert.equal(fiada.ok && "medioPago" in fiada.data, false);
});

test("validarNuevaVenta guarda como DESCONOCIDO una venta pagada vieja de la cola offline", () => {
  // Venta guardada en IndexedDB por la versión anterior, sin medioPago.
  const pendienteVieja = JSON.parse(
    JSON.stringify({ ...ventaBase, estadoPago: "PAGADA" }),
  ) as unknown;
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta(pendienteVieja, true),
  );
  assert.deepEqual(resultado, {
    ok: true,
    data: {
      fecha: ventaBase.fecha,
      items: [{ ...ventaBase.items[0], precioUnitario: 10.24 }],
      estadoPago: "PAGADA",
      medioPago: "DESCONOCIDO",
    },
  });

  // Formato todavía más viejo (tipoPago CONTADO).
  const contadoLegado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta(
      { fecha: ventaBase.fecha, items: ventaBase.items, tipoPago: "CONTADO" },
      true,
    ),
  );
  assert.equal(contadoLegado.ok && contadoLegado.data.medioPago, "DESCONOCIDO");
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
  const resultado = conAhora("2026-10-02T12:00:00.000Z", () =>
    validarNuevaVenta({ ...conceptoLibre, medioPago: "EFECTIVO" }),
  );
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
