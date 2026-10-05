"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import {
  obtenerPendientes,
  quitarVentaPendiente,
  reintentarVentaPendiente,
} from "@/features/offline-sync/lib/cola-ventas";
import { fechaLocalISO, ZONA_HORARIA } from "@/shared/lib/fechas";
import { formatearPesos } from "@/shared/lib/moneda";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { TotalDelDia } from "@/features/daily-summary/ui/TotalDelDia";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";
import { useToast } from "@/shared/ui/use-toast";
import type { VentaPendiente } from "@/shared/types/venta";

export function PendientesDelDia({
  fecha,
  totalServidor,
  clienteIds,
}: {
  fecha: string;
  totalServidor: number;
  clienteIds: string[];
}): ReactElement {
  const [pendientes, setPendientes] = useState<VentaPendiente[]>([]);
  const [pendientePorDescartar, setPendientePorDescartar] = useState<VentaPendiente | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const idsPendientesPrevios = useRef<string[]>([]);
  const { enLinea } = useEstadoConexion();
  const { mostrar } = useToast();
  const router = useRouter();
  const idsServidor = new Set(clienteIds);
  const delDia = pendientes.filter(
    (pendiente) =>
      fechaLocalISO(new Date(pendiente.venta.fecha)) === fecha &&
      !idsServidor.has(pendiente.localId),
  );
  const sumables = delDia.filter((pendiente) => pendiente.estado !== "requiere-revision");
  const totalPendiente = sumables.reduce(
    (total, pendiente) =>
      pendiente.venta.tipoPago === "FIADO"
        ? total
        : total +
          pendiente.venta.items.reduce(
            (subtotal, item) => subtotal + item.cantidad * item.precioUnitario,
            0,
          ),
    0,
  );

  useEffect(() => {
    let activo = true;
    const actualizar = async () => {
      const resultado = await obtenerPendientes();
      if (!activo) return;
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      const idsNuevos = resultado.data.map((pendiente) => pendiente.localId);
      if (idsPendientesPrevios.current.some((id) => !idsNuevos.includes(id))) router.refresh();
      idsPendientesPrevios.current = idsNuevos;
      setPendientes(resultado.data);
    };
    const actualizarConManejoError = () => {
      void actualizar().catch((error: unknown) => {
        console.error("sales-history.PendientesDelDia", error);
        mostrar("No se pudieron cargar las ventas pendientes.", "error");
      });
    };
    actualizarConManejoError();
    window.addEventListener("ventas-pendientes-cambio", actualizarConManejoError);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", actualizarConManejoError);
    };
  }, [mostrar, router]);

  const descartar = async () => {
    if (!pendientePorDescartar) return;
    setActualizando(true);
    const resultado = await quitarVentaPendiente(pendientePorDescartar.localId);
    setActualizando(false);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    setPendientePorDescartar(null);
    mostrar("Venta pendiente descartada.");
  };

  const reintentar = async (pendiente: VentaPendiente) => {
    const resultado = await reintentarVentaPendiente(pendiente.localId);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    mostrar("Venta agregada a la cola de sincronización.");
  };

  return (
    <>
      <TotalDelDia
        total={totalServidor + totalPendiente}
        sinConexion={!enLinea || sumables.length > 0}
      />
      {delDia.length > 0 ? (
        <section className="pendientes-historial" aria-labelledby="pendientes-titulo">
          <h2 id="pendientes-titulo">Pendientes de sincronizar</h2>
          <div className="lista-ventas">
            {delDia.map((pendiente) => {
              const requiereRevision = pendiente.estado === "requiere-revision";
              const total = pendiente.venta.items.reduce(
                (subtotal, item) => subtotal + item.cantidad * item.precioUnitario,
                0,
              );
              return (
                <article className="fila-venta" key={pendiente.localId}>
                  <div className="fila-venta__abrir">
                    <span className="fila-venta__fecha">
                      {new Intl.DateTimeFormat("es-AR", {
                        timeZone: ZONA_HORARIA,
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(pendiente.venta.fecha))}
                    </span>
                    <span className="fila-venta__total">{formatearPesos(total)}</span>
                    <strong
                      className={requiereRevision ? "etiqueta-anulada" : "etiqueta-pendiente"}
                    >
                      {requiereRevision
                        ? "Requiere revisión"
                        : pendiente.venta.tipoPago === "FIADO"
                          ? `Fiado de ${pendiente.venta.clienteNombre}`
                          : "Pendiente"}
                    </strong>
                  </div>
                  <ul className="pendiente-venta__items">
                    {pendiente.venta.items.map((item, indice) => (
                      <li key={`${item.productoId}-${indice}`}>
                        {item.cantidad}x {item.productoNombre}
                      </li>
                    ))}
                  </ul>
                  {requiereRevision ? (
                    <p className="pendiente-venta__error">{pendiente.ultimoError}</p>
                  ) : null}
                  <div className="pendiente-venta__acciones">
                    {requiereRevision ? (
                      <button
                        type="button"
                        className="boton boton--secundario"
                        onClick={() => void reintentar(pendiente)}
                      >
                        Reintentar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="boton boton--peligro"
                      onClick={() => setPendientePorDescartar(pendiente)}
                    >
                      Descartar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      <ConfirmarAccion
        abierto={Boolean(pendientePorDescartar)}
        titulo="Descartar venta pendiente"
        mensaje="Esta venta se quitará de este dispositivo y no se sincronizará."
        textoConfirmar="Descartar"
        confirmando={actualizando}
        alConfirmar={() => void descartar()}
        alCancelar={() => setPendientePorDescartar(null)}
      />
    </>
  );
}
