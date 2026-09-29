"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { anularVenta } from "@/features/sales/actions/anular-venta";
import { DetalleVenta } from "@/features/sales-history/ui/DetalleVenta";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { useToast } from "@/shared/ui/use-toast";
import { ZONA_HORARIA } from "@/shared/lib/fechas";
import { formatearPesos } from "@/shared/lib/moneda";
import type { Venta } from "@/shared/types/venta";

export function ListaVentas({ ventas }: { ventas: Venta[] }): ReactElement {
  const [ventaAbierta, setVentaAbierta] = useState<number | null>(null);
  const [ventaPorAnular, setVentaPorAnular] = useState<Venta | null>(null);
  const [anulando, setAnulando] = useState(false);
  const { mostrar } = useToast();
  const router = useRouter();

  const confirmarAnulacion = async () => {
    if (!ventaPorAnular) return;
    setAnulando(true);
    const resultado = await anularVenta(ventaPorAnular.id);
    setAnulando(false);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    mostrar("Venta anulada.");
    setVentaPorAnular(null);
    router.refresh();
  };

  return (
    <div className="lista-ventas">
      {ventas.length === 0 ? (
        <p className="estado-vacio">No hay ventas para este día.</p>
      ) : (
        ventas.map((venta) => (
          <article
            key={venta.id}
            className={`fila-venta${venta.anulada ? " fila-venta--anulada" : ""}`}
          >
            <button
              type="button"
              className="fila-venta__abrir"
              aria-expanded={ventaAbierta === venta.id}
              onClick={() => setVentaAbierta(ventaAbierta === venta.id ? null : venta.id)}
            >
              <span className="fila-venta__fecha">
                {new Intl.DateTimeFormat("es-AR", {
                  timeZone: ZONA_HORARIA,
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(venta.fecha))}
              </span>
              <span className="fila-venta__total">{formatearPesos(venta.total)}</span>
              {venta.anulada ? <span className="etiqueta-anulada">Anulada</span> : null}
            </button>
            {ventaAbierta === venta.id ? (
              <DetalleVenta
                venta={venta}
                onAnular={venta.anulada ? undefined : () => setVentaPorAnular(venta)}
              />
            ) : null}
          </article>
        ))
      )}
      <ConfirmarAccion
        abierto={Boolean(ventaPorAnular)}
        titulo="Anular venta"
        mensaje={
          ventaPorAnular
            ? `¿Querés anular la venta por ${formatearPesos(ventaPorAnular.total)}? No se borrará del historial.`
            : ""
        }
        textoConfirmar="Anular venta"
        confirmando={anulando}
        alConfirmar={() => void confirmarAnulacion()}
        alCancelar={() => setVentaPorAnular(null)}
      />
    </div>
  );
}
