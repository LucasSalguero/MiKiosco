import type { Producto } from "@/shared/types/producto";

type ProductoPersistido = {
  id: number;
  nombre: string;
  precio: { toString: () => string };
  activo: boolean;
  createdAt: Date;
};

export function mapearProducto(producto: ProductoPersistido): Producto {
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio.toString()),
    activo: producto.activo,
    createdAt: producto.createdAt.toISOString(),
  };
}
