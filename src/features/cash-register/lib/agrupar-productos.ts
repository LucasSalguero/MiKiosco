import { normalizarTexto } from "@/shared/lib/texto";
import type { ProductoVendido } from "@/shared/types/caja";

export type ItemVendido = {
  productoId: number | null;
  productoNombre: string;
  cantidad: number;
  precioUnitarioCentavos: number;
};

/**
 * Productos más vendidos (por cantidad, y por importe si empatan). Agrupa por
 * productoId; las ventas rápidas sin producto se agrupan por nombre normalizado.
 * Recibe solo ítems de ventas no anuladas. El importe vuelve en centavos.
 */
export function topProductos(items: readonly ItemVendido[], limite = 5): ProductoVendido[] {
  const grupos = new Map<string, ProductoVendido>();

  for (const item of items) {
    const clave =
      item.productoId === null
        ? `nombre:${normalizarTexto(item.productoNombre)}`
        : `producto:${item.productoId}`;
    const actual = grupos.get(clave) ?? {
      clave,
      nombre: item.productoNombre.trim(),
      cantidad: 0,
      importe: 0,
    };
    actual.cantidad += item.cantidad;
    actual.importe += item.cantidad * item.precioUnitarioCentavos;
    grupos.set(clave, actual);
  }

  return [...grupos.values()]
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad || b.importe - a.importe || a.nombre.localeCompare(b.nombre, "es"),
    )
    .slice(0, limite);
}
