"use client";

import { useState, type ReactElement } from "react";

import { agregarProducto, cambiarCantidad, vaciarCarrito } from "@/features/sales/lib/carrito";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { registrarVenta } from "@/features/sales/lib/registrar-venta";
import { GrillaProductos } from "@/features/sales/ui/GrillaProductos";
import { CarritoVenta } from "@/features/sales/ui/CarritoVenta";
import { useToast } from "@/shared/ui/use-toast";
import type { Producto } from "@/shared/types/producto";
import type { ItemNuevaVenta } from "@/shared/types/venta";

export function VentaRapida({ productos }: { productos: Producto[] }): ReactElement {
  const [carrito, setCarrito] = useState<ItemNuevaVenta[]>([]);
  const { mostrar } = useToast();

  const total = calcularTotalVenta(carrito);

  const manejarSeleccion = (producto: Producto) => {
    setCarrito((actual) => agregarProducto(actual, producto));
  };

  const manejarCambiarCantidad = (productoId: number, cantidad: number) => {
    setCarrito((actual) => cambiarCantidad(actual, productoId, cantidad));
  };

  const manejarQuitar = (productoId: number) => {
    setCarrito((actual) => actual.filter((item) => item.productoId !== productoId));
  };

  const manejarCobrar = async () => {
    if (carrito.length === 0) {
      mostrar("Agrega productos antes de cobrar.", "error");
      return;
    }

    const resultado = await registrarVenta({
      fecha: new Date().toISOString(),
      items: carrito,
    });

    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }

    if (resultado.data.estado === "sincronizada") {
      mostrar("Venta registrada", "ok");
    } else {
      mostrar("Venta guardada sin conexión", "ok");
    }

    setCarrito(vaciarCarrito());
  };

  return (
    <div className="space-y-6">
      <GrillaProductos productos={productos} onSeleccionar={manejarSeleccion} />
      <CarritoVenta
        items={carrito}
        total={total}
        onCambiarCantidad={manejarCambiarCantidad}
        onQuitar={manejarQuitar}
        onCobrar={manejarCobrar}
      />
    </div>
  );
}
