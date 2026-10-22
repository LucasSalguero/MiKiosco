import assert from "node:assert/strict";
import test from "node:test";

import { topProductos } from "@/features/cash-register/lib/agrupar-productos";
import { ventasPorHora } from "@/features/cash-register/lib/ventas-por-hora";

test("topProductos agrupa por producto y las ventas rápidas por nombre", () => {
  const top = topProductos([
    { productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitarioCentavos: 1_000 },
    { productoId: 1, productoNombre: "Alfajor", cantidad: 3, precioUnitarioCentavos: 1_100 },
    {
      productoId: null,
      productoNombre: "Golosinas varias",
      cantidad: 1,
      precioUnitarioCentavos: 500,
    },
    {
      productoId: null,
      productoNombre: " golosinas  VARIAS ",
      cantidad: 2,
      precioUnitarioCentavos: 700,
    },
    { productoId: 2, productoNombre: "Coca 1.5 l", cantidad: 3, precioUnitarioCentavos: 3_000 },
  ]);

  assert.deepEqual(
    top.map(({ nombre, cantidad, importe }) => ({ nombre, cantidad, importe })),
    [
      { nombre: "Alfajor", cantidad: 5, importe: 5_300 },
      { nombre: "Coca 1.5 l", cantidad: 3, importe: 9_000 },
      { nombre: "Golosinas varias", cantidad: 3, importe: 1_900 },
    ],
  );
});

test("topProductos devuelve como máximo el límite pedido", () => {
  const items = Array.from({ length: 8 }, (_, indice) => ({
    productoId: indice + 1,
    productoNombre: `P${indice + 1}`,
    cantidad: indice + 1,
    precioUnitarioCentavos: 100,
  }));
  const top = topProductos(items);
  assert.equal(top.length, 5);
  assert.equal(top[0].nombre, "P8");
});

test("ventasPorHora usa la hora de Buenos Aires y excluye anuladas", () => {
  const franjas = ventasPorHora([
    // 23:30 del 1/10 en Buenos Aires
    { fecha: "2026-10-02T02:30:00.000Z", totalCentavos: 1_000, anulada: false },
    // 09:15 y 09:45 del 2/10
    { fecha: "2026-10-02T12:15:00.000Z", totalCentavos: 500, anulada: false },
    { fecha: new Date("2026-10-02T12:45:00.000Z"), totalCentavos: 700, anulada: false },
    { fecha: "2026-10-02T12:50:00.000Z", totalCentavos: 9_999, anulada: true },
  ]);

  assert.equal(franjas.length, 24);
  assert.deepEqual(franjas[23], { hora: 23, cantidad: 1, importe: 1_000 });
  assert.deepEqual(franjas[9], { hora: 9, cantidad: 2, importe: 1_200 });
  assert.equal(
    franjas.reduce((total, franja) => total + franja.cantidad, 0),
    3,
  );
});
