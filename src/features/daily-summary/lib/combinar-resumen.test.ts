import { describe, expect, it } from "vitest";

import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import type { VentaPendiente } from "@/shared/types/venta";

const pendiente = (
  localId: string,
  fecha: string,
  estado?: VentaPendiente["estado"],
  tipoPago: VentaPendiente["venta"]["tipoPago"] = "CONTADO",
): VentaPendiente => ({
  localId,
  venta: {
    fecha,
    items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 1.25 }],
    tipoPago,
  },
  creadaEn: fecha,
  intentos: 0,
  estado,
});

describe("combinarConPendientes", () => {
  it("suma solo ventas locales del día no sincronizadas ni marcadas para revisión", () => {
    const resultado = combinarConPendientes(
      { fecha: "2026-10-02", total: 10, cantidadVentas: 1, clienteIds: ["ya-sincronizada"] },
      [
        pendiente("local-hoy", "2026-10-02T15:00:00.000Z"),
        pendiente("ya-sincronizada", "2026-10-02T16:00:00.000Z"),
        pendiente("revision", "2026-10-02T17:00:00.000Z", "requiere-revision"),
        pendiente("otro-dia", "2026-10-01T15:00:00.000Z"),
      ],
      "2026-10-02",
    );

    expect(resultado).toEqual({ fecha: "2026-10-02", total: 12.5, cantidadVentas: 2 });
  });

  it("no suma los fiados pendientes al efectivo diario", () => {
    const resultado = combinarConPendientes(
      { fecha: "2026-10-02", total: 10, cantidadVentas: 1 },
      [
        pendiente("contado", "2026-10-02T15:00:00.000Z"),
        pendiente("fiado", "2026-10-02T16:00:00.000Z", undefined, "FIADO"),
      ],
      "2026-10-02",
    );

    expect(resultado.total).toBe(12.5);
    expect(resultado.cantidadVentas).toBe(3);
  });
});
