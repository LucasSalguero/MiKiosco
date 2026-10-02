export function esIdEnteroValido(id: unknown): id is number {
  return Number.isSafeInteger(id) && typeof id === "number" && id > 0 && id <= 2_147_483_647;
}
