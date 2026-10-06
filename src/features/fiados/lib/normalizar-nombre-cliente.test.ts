import assert from "node:assert/strict";
import test from "node:test";

import { normalizarNombreCliente } from "@/features/fiados/lib/normalizar-nombre-cliente";

test("normalizarNombreCliente recorta, quita tildes y pasa a minúsculas", () => {
  assert.equal(normalizarNombreCliente("  ÁNGELES Muñoz "), "angeles munoz");
});
