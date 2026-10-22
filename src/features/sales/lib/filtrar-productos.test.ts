import assert from "node:assert/strict";
import test from "node:test";

import { categoriasPresentes, filtrarProductos } from "@/features/sales/lib/filtrar-productos";
import type { Producto } from "@/shared/types/producto";

const producto = (
  id: number,
  nombre: string,
  categoria: Producto["categoria"],
  marca: string | null = null,
): Producto => ({
  id,
  nombre,
  precio: 100,
  categoria,
  marca,
  codigoBarras: null,
  activo: true,
  createdAt: "2026-10-01T00:00:00.000Z",
});

const catalogo = [
  producto(1, "Coca 1.5 l", "BEBIDAS", "Coca-Cola"),
  producto(2, "Sprite 500 ml", "BEBIDAS", "Coca-Cola"),
  producto(3, "Alfajor triple", "GOLOSINAS", "Jorgito"),
  producto(4, "Agua", "BEBIDAS"),
  producto(5, "Fósforos", "VARIOS"),
];

test("filtrarProductos filtra por categoría y ordena por nombre", () => {
  assert.deepEqual(
    filtrarProductos(catalogo, { categoria: "BEBIDAS", busqueda: "" }).map((p) => p.id),
    [4, 1, 2],
  );
  assert.equal(filtrarProductos(catalogo, { categoria: null, busqueda: "" }).length, 5);
});

test("filtrarProductos busca por nombre o marca, sin tildes y por palabras", () => {
  const ids = (busqueda: string, categoria: Producto["categoria"] | null = null) =>
    filtrarProductos(catalogo, { categoria, busqueda }).map((p) => p.id);

  assert.deepEqual(ids("coca cola"), [1, 2]);
  assert.deepEqual(ids("JORGITO"), [3]);
  assert.deepEqual(ids("fosforos"), [5]);
  assert.deepEqual(ids("sprite coca"), [2]);
  assert.deepEqual(ids("coca", "GOLOSINAS"), []);
});

test("filtrarProductos trata como VARIOS los productos de una caché vieja sin categoría", () => {
  const viejo = { ...producto(9, "Encendedor", "VARIOS") } as Partial<Producto>;
  delete viejo.categoria;
  const lista = [viejo as Producto];
  assert.equal(filtrarProductos(lista, { categoria: "VARIOS", busqueda: "" }).length, 1);
  assert.deepEqual(
    categoriasPresentes(lista).map((c) => c.valor),
    ["VARIOS"],
  );
});

test("categoriasPresentes respeta el orden de las categorías", () => {
  assert.deepEqual(
    categoriasPresentes(catalogo).map((c) => c.valor),
    ["BEBIDAS", "GOLOSINAS", "VARIOS"],
  );
});
