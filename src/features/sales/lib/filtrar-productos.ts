import { normalizarTexto } from "@/shared/lib/texto";
import { CATEGORIAS, type CategoriaProducto, type Producto } from "@/shared/types/producto";

/**
 * Filtra en memoria (sirve offline sobre el catálogo en caché) por categoría y
 * por un texto que puede estar en el nombre o en la marca. Ordena por nombre.
 */
export function filtrarProductos(
  productos: readonly Producto[],
  { categoria, busqueda }: { categoria: CategoriaProducto | null; busqueda: string },
): Producto[] {
  const terminos = normalizarTexto(busqueda).split(" ").filter(Boolean);
  return productos
    .filter((producto) => {
      if (categoria && (producto.categoria ?? "VARIOS") !== categoria) return false;
      if (terminos.length === 0) return true;
      const texto = normalizarTexto(`${producto.nombre} ${producto.marca ?? ""}`);
      return terminos.every((termino) => texto.includes(termino));
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));
}

/** Categorías que tienen al menos un producto, en el orden de CATEGORIAS. */
export function categoriasPresentes(
  productos: readonly Producto[],
): Array<{ valor: CategoriaProducto; etiqueta: string }> {
  const presentes = new Set(productos.map((producto) => producto.categoria ?? "VARIOS"));
  return CATEGORIAS.filter((categoria) => presentes.has(categoria.valor));
}
