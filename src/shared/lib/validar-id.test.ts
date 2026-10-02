import { describe, expect, it } from "vitest";

import { esIdEnteroValido } from "@/shared/lib/validar-id";

describe("esIdEnteroValido", () => {
  it.each([null, undefined, 0, -1, 1.2, Number.MAX_SAFE_INTEGER + 1, 2_147_483_648, "12"])(
    "rechaza identificadores inválidos: %s",
    (id) => {
      expect(esIdEnteroValido(id)).toBe(false);
    },
  );

  it("acepta enteros positivos dentro del rango Int de PostgreSQL", () => {
    expect(esIdEnteroValido(1)).toBe(true);
    expect(esIdEnteroValido(2_147_483_647)).toBe(true);
  });
});
