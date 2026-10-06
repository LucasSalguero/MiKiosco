import assert from "node:assert/strict";
import test from "node:test";

import { esIdEnteroValido } from "@/shared/lib/validar-id";

test("esIdEnteroValido rechaza identificadores inválidos", () => {
  for (const id of [
    null,
    undefined,
    0,
    -1,
    1.2,
    Number.MAX_SAFE_INTEGER + 1,
    2_147_483_648,
    "12",
  ]) {
    assert.equal(esIdEnteroValido(id), false);
  }
});

test("esIdEnteroValido acepta enteros positivos dentro del rango Int", () => {
  assert.equal(esIdEnteroValido(1), true);
  assert.equal(esIdEnteroValido(2_147_483_647), true);
});
