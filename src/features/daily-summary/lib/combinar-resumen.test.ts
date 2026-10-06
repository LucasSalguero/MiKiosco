import assert from "node:assert/strict";
import test from "node:test";

import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import type { VentaPendiente } from "@/shared/types/venta";

const pendiente = (
  localId: string,
  fecha: string,
  estado?: VentaPendiente["estado"],
  estadoPago: NonNullable<VentaPendiente["venta"]["estadoPago"]> = "PAGADA",
): VentaPendiente => ({
  localId,
  venta: {
    fecha,
    items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 1.25 }],
    estadoPago,
  },
  creadaEn: fecha,
  intentos: 0,
  estado,
});

test("combina ventas pendientes del día sin repetir sincronizadas o en revisión", () => {
  const resultado = combinarConPendientes(
    {
      fecha: "2026-10-02",
      vendido: 10,
      cobrado: 10,
      fiadoNuevo: 0,
      deudaTotal: 0,
      cantidadVentas: 1,
      cantidadACobrarHoy: 0,
      clavesOperacion: ["ya-sincronizada"],
    },
    [
      pendiente("local-hoy", "2026-10-02T15:00:00.000Z"),
      pendiente("ya-sincronizada", "2026-10-02T16:00:00.000Z"),
      pendiente("revision", "2026-10-02T17:00:00.000Z", "requiere-revision"),
      pendiente("otro-dia", "2026-10-01T15:00:00.000Z"),
    ],
    "2026-10-02",
  );

  assert.equal(resultado.vendido, 12.5);
  assert.equal(resultado.cobrado, 12.5);
  assert.equal(resultado.cantidadVentas, 2);
});

test("las ventas fiadas offline aumentan vendido y deuda, pero no cobrado", () => {
  const resultado = combinarConPendientes(
    {
      fecha: "2026-10-02",
      vendido: 10,
      cobrado: 10,
      fiadoNuevo: 0,
      deudaTotal: 40,
      cantidadVentas: 1,
      cantidadACobrarHoy: 0,
    },
    [
      pendiente("contado", "2026-10-02T15:00:00.000Z"),
      pendiente("transfiere", "2026-10-02T16:00:00.000Z", undefined, "A_COBRAR_HOY"),
      pendiente("mensual", "2026-10-02T17:00:00.000Z", undefined, "FIADA"),
    ],
    "2026-10-02",
  );

  assert.equal(resultado.vendido, 17.5);
  assert.equal(resultado.cobrado, 12.5);
  assert.equal(resultado.fiadoNuevo, 5);
  assert.equal(resultado.deudaTotal, 45);
  assert.equal(resultado.cantidadACobrarHoy, 1);
  assert.equal(resultado.cantidadVentas, 4);
});

test("una venta fiada de la cola de una versión anterior tampoco suma a cobrado", () => {
  const ventaLegada = {
    fecha: "2026-10-02T18:00:00.000Z",
    items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 1.25 }],
    tipoPago: "FIADO",
    clienteNombre: "Ana",
  };
  const pendienteLegado: VentaPendiente = {
    localId: "fiado-legado",
    venta: ventaLegada,
    creadaEn: ventaLegada.fecha,
    intentos: 0,
  };
  const resultado = combinarConPendientes(null, [pendienteLegado], "2026-10-02");

  assert.equal(resultado.vendido, 2.5);
  assert.equal(resultado.cobrado, 0);
  assert.equal(resultado.fiadoNuevo, 2.5);
  assert.equal(resultado.deudaTotal, 2.5);
});
