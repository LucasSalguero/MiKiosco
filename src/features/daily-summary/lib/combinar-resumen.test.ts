import { describe, expect, it } from "vitest";

import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import type { VentaPendiente } from "@/shared/types/venta";

const pendiente = (
  localId: string,
  fecha: string,
  estado?: VentaPendiente["estado"],
): VentaPendiente => ({
  localId,
  venta: {
    fecha,
    items: [{ productoId: 1, productoNombre: "Alfajor", cantidad: 2, precioUnitario: 1.25 }],
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
});
