"use client";

import { useState, type ReactElement } from "react";
import { anularVenta } from "@/features/sales/actions/anular-venta";
import { quitarVentaPendiente } from "@/features/offline-sync/lib/cola-ventas";
import { agregarProducto, cambiarCantidad, vaciarCarrito } from "@/features/sales/lib/carrito";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { registrarVenta, type VentaRegistrada } from "@/features/sales/lib/registrar-venta";
import { CarritoVenta } from "@/features/sales/ui/CarritoVenta";
import { GrillaProductos } from "@/features/sales/ui/GrillaProductos";
import { useToast } from "@/shared/ui/use-toast";
import type { Producto } from "@/shared/types/producto";
import type { ItemNuevaVenta } from "@/shared/types/venta";

export function VentaRapida({ productos }: { productos: Producto[] }): ReactElement {
  const [carrito, setCarrito] = useState<ItemNuevaVenta[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const { mostrar } = useToast();
  const total = calcularTotalVenta(carrito);
  const publicarCambioTotal = (diferencia: number) => window.dispatchEvent(new CustomEvent("total-del-dia-cambio", { detail: { diferencia } }));
  const deshacer = async (venta: VentaRegistrada, importe: number) => {
    const resultado = venta.estado === "sincronizada" ? await anularVenta(venta.id) : await quitarVentaPendiente(venta.localId);
    if (!resultado.ok) { mostrar(resultado.error, "error"); return; }
    publicarCambioTotal(-importe); mostrar("Venta deshecha.");
  };
  const manejarCobrar = async () => {
    if (!carrito.length || cobrando) return;
    setCobrando(true); const importe = total;
    const resultado = await registrarVenta({ fecha: new Date().toISOString(), items: carrito });
    setCobrando(false);
    if (!resultado.ok) { mostrar("No se pudo guardar la venta. Revisá tu conexión e intentá de nuevo.", "error"); return; }
    setCarrito(vaciarCarrito()); publicarCambioTotal(importe);
    const mensaje = resultado.data.estado === "pendiente" ? "Venta guardada. Se sincronizará cuando vuelva la conexión." : "Venta registrada.";
    mostrar(mensaje, "ok", { etiqueta: "Deshacer", alEjecutar: () => void deshacer(resultado.data, importe) });
  };
  return <div className="zona-venta"><GrillaProductos productos={productos} onSeleccionar={(producto) => setCarrito((actual) => agregarProducto(actual, producto))} /><CarritoVenta items={carrito} total={total} cobrando={cobrando} onCambiarCantidad={(id, cantidad) => setCarrito((actual) => cambiarCantidad(actual, id, cantidad))} onQuitar={(id) => setCarrito((actual) => actual.filter((item) => item.productoId !== id))} onCobrar={manejarCobrar} /></div>;
}
