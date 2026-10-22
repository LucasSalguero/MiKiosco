import { normalizarTexto } from "@/shared/lib/texto";
import type { Producto } from "@/shared/types/producto";

/**
 * Forma comparable del nombre de un producto:
 * - minúsculas, sin tildes y sin espacios repetidos;
 * - coma decimal entre números → punto ("1,5" → "1.5");
 * - número y unidad separados ("1.5lt" → "1.5 lt");
 * - "l", "lt", "lts", "litro" y "litros" unificados como "l";
 * - signos sueltos (guiones, puntos finales) como espacios.
 */
export function normalizarNombreProducto(nombre: string): string {
  return normalizarTexto(nombre)
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\.(?!\d)|(?<!\d)\./g, " ")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/\b(?:lts?|litros?)\b/g, "l")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Productos ya cargados (activos o no) cuyo nombre normalizado coincide con el
 * nuevo, también si solo difieren en los espacios ("coca cola" / "cocacola").
 */
export function buscarPosiblesDuplicados(
  nombre: string,
  productos: readonly Producto[],
  excluirId?: number,
): Producto[] {
  const normalizado = normalizarNombreProducto(nombre);
  if (!normalizado) return [];
  const sinEspacios = normalizado.replace(/ /g, "");
  return productos.filter((producto) => {
    if (producto.id === excluirId) return false;
    const otro = normalizarNombreProducto(producto.nombre);
    return otro === normalizado || otro.replace(/ /g, "") === sinEspacios;
  });
}
