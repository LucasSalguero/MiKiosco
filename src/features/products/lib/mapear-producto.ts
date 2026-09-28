import type { Producto } from "@/shared/types/producto";
import { decimalANumero } from "@/shared/lib/moneda";

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
    precio: decimalANumero(producto.precio),
    activo: producto.activo,
    createdAt: producto.createdAt.toISOString(),
  };
}
