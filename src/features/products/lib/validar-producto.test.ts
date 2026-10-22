import assert from "node:assert/strict";
import test from "node:test";

import { completarProductoCacheado } from "@/features/products/lib/mapear-producto";
import { validarDatosProducto } from "@/features/products/lib/validar-producto";
import type { Producto } from "@/shared/types/producto";

test("validarDatosProducto limpia marca y código y usa VARIOS por defecto", () => {
  assert.deepEqual(
    validarDatosProducto({
      nombre: " Coca 1.5 l ",
      precio: 2500.456,
      marca: "  Coca  Cola ",
      codigoBarras: " 7790895 000997 ",
    }),
    {
      ok: true,
      data: {
        nombre: "Coca 1.5 l",
        precio: 2500.46,
        categoria: "VARIOS",
        marca: "Coca Cola",
        codigoBarras: "7790895000997",
      },
    },
  );

  const sinOpcionales = validarDatosProducto({
    nombre: "Alfajor",
    precio: 800,
    categoria: "GOLOSINAS",
    marca: "  ",
    codigoBarras: "",
  });
  assert.equal(sinOpcionales.ok && sinOpcionales.data.marca, null);
  assert.equal(sinOpcionales.ok && sinOpcionales.data.codigoBarras, null);
  assert.equal(sinOpcionales.ok && sinOpcionales.data.categoria, "GOLOSINAS");
});

test("validarDatosProducto rechaza categoría, marca o código inválidos", () => {
  const base = { nombre: "Alfajor", precio: 800 };
  const casos: unknown[] = [
    { ...base, categoria: "ROPA" },
    { ...base, marca: 5 },
    { ...base, marca: "a".repeat(81) },
    { ...base, codigoBarras: "123" },
    { ...base, codigoBarras: "77908950A0997" },
    { ...base, codigoBarras: "1".repeat(33) },
    { ...base, precio: 0 },
    { ...base, nombre: " " },
  ];
  for (const datos of casos) {
    assert.equal(validarDatosProducto(datos).ok, false, JSON.stringify(datos));
  }
});

test("completarProductoCacheado completa productos de una caché anterior", () => {
  const viejo = {
    id: 1,
    nombre: "Alfajor",
    precio: 800,
    activo: true,
    createdAt: "2026-10-01T12:00:00.000Z",
  } as unknown as Producto;

  assert.deepEqual(completarProductoCacheado(viejo), {
    ...viejo,
    categoria: "VARIOS",
    marca: null,
    codigoBarras: null,
  });

  const nuevo: Producto = {
    ...viejo,
    categoria: "BEBIDAS",
    marca: "Coca",
    codigoBarras: "123456",
  };
  assert.deepEqual(completarProductoCacheado(nuevo), nuevo);
});
