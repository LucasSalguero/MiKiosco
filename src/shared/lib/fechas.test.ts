import { describe, expect, it } from "vitest";

import { fechaLocalISO, rangoDelDia, ZONA_HORARIA } from "@/shared/lib/fechas";

describe("rangoDelDia", () => {
  it("usa límites de medianoche de Buenos Aires, con fin exclusivo", () => {
    const { desde, hasta } = rangoDelDia("2026-10-02");

    expect(ZONA_HORARIA).toBe("America/Argentina/Buenos_Aires");
    expect(desde.toISOString()).toBe("2026-10-02T03:00:00.000Z");
    expect(hasta.toISOString()).toBe("2026-10-03T03:00:00.000Z");
    expect(fechaLocalISO(new Date("2026-10-02T02:59:59.999Z"))).toBe("2026-10-01");
    expect(fechaLocalISO(desde)).toBe("2026-10-02");
  });
});
