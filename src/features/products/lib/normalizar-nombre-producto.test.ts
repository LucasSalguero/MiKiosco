import assert from "node:assert/strict";
import test from "node:test";

import {
  buscarPosiblesDuplicados,
  normalizarNombreProducto,
} from "@/features/products/lib/normalizar-nombre-producto";
import type { Producto } from "@/shared/types/producto";

test("normalizarNombreProducto unifica mayúsculas, tildes, espacios y litros", () => {
  const variantes = [
    "Coca 1,5 lt",
    "coca 1.5 litros",
    "COCA  1.5L",
    "Coca 1,5lts",
    "coca 1.5 Litro",
    " Cóca 1.5 l. ",
  ];
  for (const variante of variantes) {
    assert.equal(normalizarNombreProducto(variante), "coca 1.5 l", variante);
  }
});

test("normalizarNombreProducto no rompe palabras que contienen l o lt", () => {
  assert.equal(normalizarNombreProducto("Leche La Serenísima"), "leche la serenisima");
  assert.equal(normalizarNombreProducto("Galletitas Oreo 118 g"), "galletitas oreo 118 g");
  assert.equal(normalizarNombreProducto("Coca-Cola 2,25L"), "coca cola 2.25 l");
  assert.equal(normalizarNombreProducto("Fernet 750ml"), "fernet 750 ml");
});

const producto = (id: number, nombre: string, activo = true): Producto => ({
  id,
  nombre,
  precio: 100,
  categoria: "VARIOS",
  marca: null,
  codigoBarras: null,
  activo,
  createdAt: "2026-10-01T00:00:00.000Z",
});

test("buscarPosiblesDuplicados encuentra coincidencias activas e inactivas", () => {
  const productos = [
    producto(1, "Coca Cola 1.5 litros"),
    producto(2, "Cocacola 1,5 lt", false),
    producto(3, "Coca Cola 2.25 l"),
    producto(4, "Alfajor"),
  ];

  assert.deepEqual(
    buscarPosiblesDuplicados("coca cola 1,5L", productos).map((p) => p.id),
    [1, 2],
  );
  assert.deepEqual(buscarPosiblesDuplicados("Agua", productos), []);
  assert.deepEqual(buscarPosiblesDuplicados("   ", productos), []);
  assert.deepEqual(
    buscarPosiblesDuplicados("alfajor", productos, 4).map((p) => p.id),
    [],
  );
});
