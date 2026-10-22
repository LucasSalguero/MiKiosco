import type { CategoriaProducto, Producto } from "@/shared/types/producto";
import { decimalANumero } from "@/shared/lib/moneda";
import { esCategoriaProducto } from "@/features/products/lib/validar-producto";

type ProductoPersistido = {
  id: number;
  nombre: string;
  precio: { toString: () => string };
  categoria: CategoriaProducto;
  marca: string | null;
  codigoBarras: string | null;
  activo: boolean;
  createdAt: Date;
};

export function mapearProducto(producto: ProductoPersistido): Producto {
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: decimalANumero(producto.precio),
    categoria: producto.categoria,
    marca: producto.marca,
    codigoBarras: producto.codigoBarras,
    activo: producto.activo,
    createdAt: producto.createdAt.toISOString(),
  };
}

/**
 * Completa un producto leído de la caché local. Los guardados por versiones
 * anteriores no tienen categoría ni marca: quedan en VARIOS y sin marca.
 */
export function completarProductoCacheado(producto: Producto): Producto {
  const guardado = producto as Partial<Producto> & Pick<Producto, "id" | "nombre" | "precio">;
  return {
    ...producto,
    categoria: esCategoriaProducto(guardado.categoria) ? guardado.categoria : "VARIOS",
    marca: typeof guardado.marca === "string" ? guardado.marca : null,
    codigoBarras: typeof guardado.codigoBarras === "string" ? guardado.codigoBarras : null,
  };
}
