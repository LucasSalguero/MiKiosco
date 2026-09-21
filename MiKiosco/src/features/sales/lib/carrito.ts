import type { Carrito, ItemNuevaVenta } from "@/shared/types/venta";

export function agregarProducto(carrito: Carrito, producto: {
  id: number;
  nombre: string;
  precio: number;
}): Carrito {
  const itemExistente = carrito.find((item) => item.productoId === producto.id);

  if (itemExistente) {
    return carrito.map((item) =>
      item.productoId === producto.id
        ? { ...item, cantidad: item.cantidad + 1 }
        : item,
    );
  }

  return [
    ...carrito,
    {
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.precio,
    },
  ];
}

export function cambiarCantidad(carrito: Carrito, productoId: number, cantidad: number): Carrito {
  if (cantidad <= 0) {
    return carrito.filter((item) => item.productoId !== productoId);
  }

  return carrito.map((item) =>
    item.productoId === productoId ? { ...item, cantidad } : item,
  );
}

export function quitarProducto(carrito: Carrito, productoId: number): Carrito {
  return carrito.filter((item) => item.productoId !== productoId);
}

export function vaciarCarrito(): Carrito {
  return [];
}
