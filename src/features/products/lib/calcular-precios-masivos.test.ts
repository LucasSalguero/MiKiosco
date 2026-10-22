import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularPrecioNuevoCentavos,
  filtrarParaActualizacion,
  previsualizarPrecios,
  validarActualizacionMasiva,
} from "@/features/products/lib/calcular-precios-masivos";
import type { Producto } from "@/shared/types/producto";

test("aplica el porcentaje redondeando al centavo", () => {
  // 1234,56 × 1,08 = 1333,3248 → 1333,32
  assert.equal(calcularPrecioNuevoCentavos(123_456, 8, "NINGUNO"), 133_332);
  // 10,05 × 1,10 = 11,055 → 11,06 (mitades hacia arriba)
  assert.equal(calcularPrecioNuevoCentavos(1_005, 10, "NINGUNO"), 1_106);
  // 0,1 + 0,2 no genera errores de punto flotante: 1000 × 1,005 = 1005
  assert.equal(calcularPrecioNuevoCentavos(100_000, 0.5, "NINGUNO"), 100_500);
});

test("redondea hacia arriba a $10 o a $50", () => {
  // 1500 × 1,08 = 1620
  assert.equal(calcularPrecioNuevoCentavos(150_000, 8, "DIEZ"), 162_000);
  assert.equal(calcularPrecioNuevoCentavos(150_000, 8, "CINCUENTA"), 165_000);
  // 1234 × 1,08 = 1332,72 → 1340 / 1350
  assert.equal(calcularPrecioNuevoCentavos(123_400, 8, "DIEZ"), 134_000);
  assert.equal(calcularPrecioNuevoCentavos(123_400, 8, "CINCUENTA"), 135_000);
});

test("un precio que ya es múltiplo no cambia al redondear", () => {
  // 1000 × 1,10 = 1100
  assert.equal(calcularPrecioNuevoCentavos(100_000, 10, "DIEZ"), 110_000);
  assert.equal(calcularPrecioNuevoCentavos(100_000, 10, "CINCUENTA"), 110_000);
});

test("porcentajes negativos y límites", () => {
  // 1000 × 0,95 = 950
  assert.equal(calcularPrecioNuevoCentavos(100_000, -5, "NINGUNO"), 95_000);
  assert.equal(calcularPrecioNuevoCentavos(100_000, -5, "CINCUENTA"), 95_000);
  // 1 centavo × 0,1 = 0 → nunca queda en 0
  assert.equal(calcularPrecioNuevoCentavos(1, -90, "NINGUNO"), 1);
  assert.equal(calcularPrecioNuevoCentavos(1, -90, "DIEZ"), 1_000);
  // Precio grande sin perder precisión (9.999.999.999,99 × 4)
  assert.equal(calcularPrecioNuevoCentavos(999_999_999_999, 300, "NINGUNO"), 3_999_999_999_996);
});

test("validarActualizacionMasiva exige porcentaje en rango y opciones válidas", () => {
  const base = { categoria: "BEBIDAS", marca: null, porcentaje: 8, redondeo: "DIEZ" };
  assert.equal(validarActualizacionMasiva(base).ok, true);
  assert.equal(validarActualizacionMasiva({ ...base, categoria: null, marca: " Arcor " }).ok, true);

  const invalidos: unknown[] = [
    null,
    { ...base, porcentaje: 0 },
    { ...base, porcentaje: -91 },
    { ...base, porcentaje: 301 },
    { ...base, porcentaje: 8.123 },
    { ...base, porcentaje: "8" },
    { ...base, categoria: "ROPA" },
    { ...base, marca: "  " },
    { ...base, redondeo: "CIEN" },
  ];
  for (const datos of invalidos) {
    assert.equal(validarActualizacionMasiva(datos).ok, false, JSON.stringify(datos));
  }
});

const producto = (
  id: number,
  nombre: string,
  precio: number,
  categoria: Producto["categoria"],
  marca: string | null,
  activo = true,
): Producto => ({
  id,
  nombre,
  precio,
  categoria,
  marca,
  codigoBarras: null,
  activo,
  createdAt: "2026-10-01T00:00:00.000Z",
});

const catalogo = [
  producto(1, "Sprite", 1200, "BEBIDAS", "Coca-Cola"),
  producto(2, "Coca 1.5 l", 2500, "BEBIDAS", "coca-cola"),
  producto(3, "Agua", 1000, "BEBIDAS", null),
  producto(4, "Alfajor", 800, "GOLOSINAS", "Jorgito"),
  producto(5, "Coca vieja", 900, "BEBIDAS", "Coca-Cola", false),
];

test("filtra por categoría y marca, solo productos activos", () => {
  const ids = (filtro: { categoria: Producto["categoria"] | null; marca: string | null }) =>
    filtrarParaActualizacion(catalogo, filtro).map((p) => p.id);

  assert.deepEqual(ids({ categoria: "BEBIDAS", marca: null }), [1, 2, 3]);
  assert.deepEqual(ids({ categoria: "BEBIDAS", marca: "COCA-COLA" }), [1, 2]);
  assert.deepEqual(ids({ categoria: null, marca: null }), [1, 2, 3, 4]);
});

test("previsualizarPrecios muestra precio actual y nuevo ordenado por nombre", () => {
  assert.deepEqual(
    previsualizarPrecios(catalogo, { categoria: "BEBIDAS", marca: "Coca-Cola" }, 8, "CINCUENTA"),
    [
      { id: 2, nombre: "Coca 1.5 l", marca: "coca-cola", precioActual: 2500, precioNuevo: 2700 },
      { id: 1, nombre: "Sprite", marca: "Coca-Cola", precioActual: 1200, precioNuevo: 1300 },
    ],
  );
});
