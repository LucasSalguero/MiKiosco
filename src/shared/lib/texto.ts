/** Texto comparable: sin espacios extremos ni repetidos, sin tildes y en minúsculas. */
export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/\s+/g, " ");
}
