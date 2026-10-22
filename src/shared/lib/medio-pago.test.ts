import assert from "node:assert/strict";
import test from "node:test";

import { etiquetaMedioPago } from "@/shared/lib/medio-pago";

test("etiquetaMedioPago muestra DESCONOCIDO como Sin registrar", () => {
  assert.equal(etiquetaMedioPago("EFECTIVO"), "Efectivo");
  assert.equal(etiquetaMedioPago("TRANSFERENCIA"), "Transferencia");
  assert.equal(etiquetaMedioPago("DESCONOCIDO"), "Sin registrar");
});
