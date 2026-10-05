import { describe, expect, it } from "vitest";

import { crearHashPin, esHashPinValido, verificarHashPin } from "@/features/auth/lib/hash-pin";

describe("hash de PIN", () => {
  it("verifica el PIN generado y no lo expone en el hash", () => {
    const pin = "001234";
    const hash = crearHashPin(pin);

    expect(hash).toMatch(/^scrypt-v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
    expect(hash).not.toContain("$");
    expect(verificarHashPin(pin, hash)).toBe(true);
    expect(verificarHashPin("001235", hash)).toBe(false);
  });

  it("rechaza hashes antiguos, corruptos o incompletos", () => {
    expect(esHashPinValido(undefined)).toBe(false);
    expect(esHashPinValido("scrypt$16384$8$1$salt$hash")).toBe(false);
    expect(esHashPinValido("scrypt-v1:sal-invalida:hash-invalido")).toBe(false);
  });
});
