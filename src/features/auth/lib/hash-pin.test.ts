import assert from "node:assert/strict";
import test from "node:test";

import { crearHashPin, esHashPinValido, verificarHashPin } from "@/features/auth/lib/hash-pin";

test("el hash generado valida el PIN y no lo expone", () => {
  const pin = "001234";
  const hash = crearHashPin(pin);

  assert.match(hash, /^scrypt-v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
  assert.equal(hash.includes("$"), false);
  assert.equal(verificarHashPin(pin, hash), true);
  assert.equal(verificarHashPin("001235", hash), false);
});

test("rechaza hashes antiguos, corruptos o incompletos", () => {
  assert.equal(esHashPinValido(undefined), false);
  assert.equal(esHashPinValido("scrypt$16384$8$1$salt$hash"), false);
  assert.equal(esHashPinValido("scrypt-v1:sal-invalida:hash-invalido"), false);
});
