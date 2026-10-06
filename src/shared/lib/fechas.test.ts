import assert from "node:assert/strict";
import test from "node:test";

import { fechaLocalISO, rangoDelDia, ZONA_HORARIA } from "@/shared/lib/fechas";

test("rangoDelDia usa medianoches de Buenos Aires, con fin exclusivo", () => {
  const { desde, hasta } = rangoDelDia("2026-10-02");

  assert.equal(ZONA_HORARIA, "America/Argentina/Buenos_Aires");
  assert.equal(desde.toISOString(), "2026-10-02T03:00:00.000Z");
  assert.equal(hasta.toISOString(), "2026-10-03T03:00:00.000Z");
  assert.equal(fechaLocalISO(new Date("2026-10-02T02:59:59.999Z")), "2026-10-01");
  assert.equal(fechaLocalISO(desde), "2026-10-02");
});

test("a las 21:00 y 00:00 el día se interpreta según Buenos Aires", () => {
  const { desde, hasta } = rangoDelDia("2026-10-02");
  const veintiuna = new Date("2026-10-03T00:00:00.000Z");
  const medianoche = new Date("2026-10-03T03:00:00.000Z");

  assert.equal(fechaLocalISO(veintiuna), "2026-10-02");
  assert.equal(veintiuna >= desde && veintiuna < hasta, true);
  assert.equal(fechaLocalISO(medianoche), "2026-10-03");
  assert.equal(medianoche >= hasta, true);
  assert.equal(veintiuna < rangoDelDia("2026-10-03").desde, true);
  assert.equal(medianoche < rangoDelDia("2026-10-03").desde, false);
});
