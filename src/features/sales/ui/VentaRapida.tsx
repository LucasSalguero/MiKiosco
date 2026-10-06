"use client";

import { useEffect, useState, type ReactElement } from "react";
import { anularVenta } from "@/features/sales/actions/anular-venta";
import { useTotalDia } from "@/features/daily-summary/ui/TotalDiaProvider";
import { quitarVentaPendiente } from "@/features/offline-sync/lib/cola-ventas";
import { agregarConcepto, agregarProducto, vaciarCarrito } from "@/features/sales/lib/carrito";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { registrarVenta, type VentaRegistrada } from "@/features/sales/lib/registrar-venta";
import { CarritoVenta } from "@/features/sales/ui/CarritoVenta";
import { GrillaProductos } from "@/features/sales/ui/GrillaProductos";
import { useToast } from "@/shared/ui/use-toast";
import { cargarClientes } from "@/features/fiados/lib/cargar-clientes";
import type { Producto } from "@/shared/types/producto";
import type { Cliente, EstadoPago, ItemNuevaVenta, NuevaVenta } from "@/shared/types/venta";

export function VentaRapida({ productos }: { productos: Producto[] }): ReactElement {
  const [carrito, setCarrito] = useState<ItemNuevaVenta[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { mostrar } = useToast();
  const { sumar } = useTotalDia();
  const total = calcularTotalVenta(carrito);
  useEffect(() => {
    let activo = true;
    const actualizarClientes = () => {
      void cargarClientes()
        .then((resultado) => {
          if (activo && resultado.ok) setClientes(resultado.data.clientes);
        })
        .catch((error: unknown) => {
          console.error("sales.VentaRapida.cargarClientes", error);
        });
    };
    actualizarClientes();
    window.addEventListener("ventas-pendientes-cambio", actualizarClientes);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", actualizarClientes);
    };
  }, []);

  const deshacer = async (venta: VentaRegistrada, importe: number, estadoPago: EstadoPago) => {
    const resultado =
      venta.estado === "sincronizada"
        ? await anularVenta(venta.id)
        : await quitarVentaPendiente(venta.localId);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    if (venta.estado === "sincronizada" && estadoPago === "PAGADA") sumar(-importe);
    mostrar("Venta deshecha.");
  };
  const registrar = async (nuevaVenta: NuevaVenta): Promise<boolean> => {
    if (!carrito.length || cobrando) return false;
    setCobrando(true);
    const importe = total;
    const resultado = await registrarVenta(nuevaVenta);
    setCobrando(false);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return false;
    }
    setCarrito(vaciarCarrito());
    if (resultado.data.estado === "sincronizada" && nuevaVenta.estadoPago === "PAGADA") {
      sumar(importe);
    }
    if (typeof window !== "undefined") window.dispatchEvent(new Event("ventas-pendientes-cambio"));
    const estadoPago = nuevaVenta.estadoPago ?? "PAGADA";
    const mensaje =
      resultado.data.estado === "pendiente"
        ? estadoPago === "PAGADA"
          ? "Venta guardada. Se sincronizará cuando vuelva la conexión."
          : "Fiado guardado. Se sincronizará cuando vuelva la conexión."
        : estadoPago === "PAGADA"
          ? "Venta registrada."
          : estadoPago === "A_COBRAR_HOY"
            ? "Quedó anotado para cobrar hoy."
            : "Fiado registrado en la cuenta mensual.";
    mostrar(mensaje, "ok", {
      etiqueta: "Deshacer",
      alEjecutar: () => void deshacer(resultado.data, importe, estadoPago),
    });
    return true;
  };
  const manejarCobrar = () =>
    registrar({ fecha: new Date().toISOString(), items: carrito, estadoPago: "PAGADA" });
  const manejarFiar = (datos: {
    estadoPago: "A_COBRAR_HOY" | "FIADA";
    clienteFiadoId?: number;
    clienteNuevoNombre?: string;
    autorizadaPor?: string;
    autorizacionConfirmada?: boolean;
  }) => registrar({ fecha: new Date().toISOString(), items: carrito, ...datos });
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
        clientes={clientes}
        onCobrar={manejarCobrar}
        onFiar={manejarFiar}
      />
    </div>
  );
}
