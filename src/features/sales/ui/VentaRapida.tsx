"use client";

import { useState, type ReactElement } from "react";
import { anularVenta } from "@/features/sales/actions/anular-venta";
import { useTotalDia } from "@/features/daily-summary/ui/TotalDiaProvider";
import { quitarVentaPendiente } from "@/features/offline-sync/lib/cola-ventas";
import { agregarConcepto, agregarProducto, vaciarCarrito } from "@/features/sales/lib/carrito";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { registrarVenta, type VentaRegistrada } from "@/features/sales/lib/registrar-venta";
import { CarritoVenta } from "@/features/sales/ui/CarritoVenta";
import { GrillaProductos } from "@/features/sales/ui/GrillaProductos";
import { useToast } from "@/shared/ui/use-toast";
import type { Producto } from "@/shared/types/producto";
import type { ItemNuevaVenta } from "@/shared/types/venta";
import type { TipoPago } from "@/shared/types/venta";

export function VentaRapida({ productos }: { productos: Producto[] }): ReactElement {
  const [carrito, setCarrito] = useState<ItemNuevaVenta[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const { mostrar } = useToast();
  const { sumar } = useTotalDia();
  const total = calcularTotalVenta(carrito);
  const deshacer = async (venta: VentaRegistrada, importe: number, tipoPago: TipoPago) => {
    const resultado =
      venta.estado === "sincronizada"
        ? await anularVenta(venta.id)
        : await quitarVentaPendiente(venta.localId);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    if (venta.estado === "sincronizada" && tipoPago === "CONTADO") sumar(-importe);
    mostrar("Venta deshecha.");
  };
  const manejarCobrar = async (tipoPago: TipoPago, clienteNombre: string): Promise<boolean> => {
    if (!carrito.length || cobrando) return false;
    if (tipoPago === "FIADO" && !clienteNombre) {
      mostrar("Ingresá el nombre del cliente para registrar el fiado.", "error");
      return false;
    }
    setCobrando(true);
    const importe = total;
    const resultado = await registrarVenta({
      fecha: new Date().toISOString(),
      items: carrito,
      tipoPago,
      ...(tipoPago === "FIADO" ? { clienteNombre } : {}),
    });
    setCobrando(false);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return false;
    }
    setCarrito(vaciarCarrito());
    if (resultado.data.estado === "sincronizada" && tipoPago === "CONTADO") sumar(importe);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("ventas-pendientes-cambio"));
    const mensaje =
      resultado.data.estado === "pendiente"
        ? tipoPago === "FIADO"
          ? "Fiado guardado. Se sincronizará cuando vuelva la conexión."
          : "Venta guardada. Se sincronizará cuando vuelva la conexión."
        : tipoPago === "FIADO"
          ? "Fiado registrado en cuentas corrientes."
          : "Venta registrada.";
    mostrar(mensaje, "ok", {
      etiqueta: "Deshacer",
      alEjecutar: () => void deshacer(resultado.data, importe, tipoPago),
    });
    return true;
  };
  return (
    <div className="zona-venta">
      <GrillaProductos
        productos={productos}
        onSeleccionar={(producto) => setCarrito((actual) => agregarProducto(actual, producto))}
      />
      <CarritoVenta
        items={carrito}
        total={total}
        cobrando={cobrando}
        onCambiarCantidad={(indice, cantidad) =>
          setCarrito((actual) =>
            cantidad <= 0
              ? actual.filter((_, actualIndice) => actualIndice !== indice)
              : actual.map((item, actualIndice) =>
                  actualIndice === indice ? { ...item, cantidad } : item,
                ),
          )
        }
        onQuitar={(indice) => setCarrito((actual) => actual.filter((_, i) => i !== indice))}
        onAgregarConcepto={(descripcion, importe) =>
          setCarrito((actual) => agregarConcepto(actual, descripcion, importe))
        }
        onCobrar={manejarCobrar}
      />
    </div>
  );
}
