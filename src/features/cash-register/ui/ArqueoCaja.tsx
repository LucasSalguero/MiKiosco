"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { cerrarCaja } from "@/features/cash-register/actions/cerrar-caja";
import { calcularDiferencia } from "@/features/cash-register/lib/calcular-diferencia";
import { obtenerPendientes } from "@/features/offline-sync/lib/cola-ventas";
import { fechaLocalISO } from "@/shared/lib/fechas";
import { aCentavos, formatearPesos } from "@/shared/lib/moneda";
import type { EstadoDiferencia, TotalesArqueo } from "@/shared/types/caja";
import { Boton } from "@/shared/ui/Boton";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { useToast } from "@/shared/ui/use-toast";

const TEXTO_DIFERENCIA: Record<EstadoDiferencia, string> = {
  exacto: "Sin diferencia",
  faltante: "Faltante",
  sobrante: "Sobrante",
};

/** Lee un importe escrito por el usuario; vacío o inválido → null. */
function leerImporte(texto: string): number | null {
  if (!texto.trim()) return null;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

export function ArqueoCaja({
  fecha,
  arqueo,
  fondoSugerido,
}: {
  fecha: string;
  arqueo: TotalesArqueo;
  fondoSugerido: number;
}): ReactElement {
  const [fondoTexto, setFondoTexto] = useState(String(fondoSugerido));
  const [contadoTexto, setContadoTexto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [pendientes, setPendientes] = useState({ sinEnviar: 0, enRevision: 0 });
  const router = useRouter();
  const { mostrar } = useToast();

  useEffect(() => {
    let activo = true;
    const contar = () => {
      void obtenerPendientes().then((resultado) => {
        if (!activo || !resultado.ok) return;
        const delDia = resultado.data.filter(
          (pendiente) => fechaLocalISO(new Date(pendiente.venta.fecha)) === fecha,
        );
        setPendientes({
          sinEnviar: delDia.filter((pendiente) => pendiente.estado !== "requiere-revision").length,
          enRevision: delDia.filter((pendiente) => pendiente.estado === "requiere-revision").length,
        });
      });
    };
    contar();
    window.addEventListener("ventas-pendientes-cambio", contar);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", contar);
    };
  }, [fecha]);

  const fondo = leerImporte(fondoTexto);
  const contado = leerImporte(contadoTexto);
  // El efectivo esperado del servidor usa el fondo sugerido; se ajusta si el dueño lo cambia.
  const esperadoCentavos =
    aCentavos(arqueo.efectivoEsperado) - aCentavos(arqueo.fondoInicial) + aCentavos(fondo ?? 0);
  const diferencia =
    contado === null ? null : calcularDiferencia(aCentavos(contado), esperadoCentavos);
  const puedeCerrar = fondo !== null && contado !== null && pendientes.sinEnviar === 0;

  const cerrar = async () => {
    if (!puedeCerrar || cerrando) return;
    setCerrando(true);
    try {
      const resultado = await cerrarCaja({
        fecha,
        fondoInicial: fondo,
        efectivoContado: contado,
        observaciones,
      });
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      mostrar("Caja cerrada.");
      setConfirmando(false);
      router.refresh();
    } catch (error) {
      console.error("cash-register.cerrarCaja", error);
      mostrar("No se pudo cerrar la caja. Revisá la conexión.", "error");
    } finally {
      setCerrando(false);
    }
  };

  return (
    <section className="seccion-caja arqueo-caja" aria-labelledby="arqueo-titulo">
      <h2 id="arqueo-titulo">Arqueo</h2>
      <dl className="arqueo-caja__detalle">
        <div>
          <dt>Ventas en efectivo y cobros de fiados</dt>
          <dd>{formatearPesos(arqueo.cobradoEfectivo)}</dd>
        </div>
        <div>
          <dt>Ingresos</dt>
          <dd>+{formatearPesos(arqueo.ingresos)}</dd>
        </div>
        <div>
          <dt>Egresos y retiros</dt>
          <dd>−{formatearPesos(arqueo.egresos + arqueo.retiros)}</dd>
        </div>
      </dl>
      <label className="campo-formulario">
        Fondo inicial
        <input
          className="entrada-formulario"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={fondoTexto}
          onChange={(evento) => setFondoTexto(evento.target.value)}
        />
        <small>Sugerido: lo contado en el último cierre ({formatearPesos(fondoSugerido)}).</small>
      </label>
      <div className="arqueo-caja__esperado">
        <span>Efectivo esperado</span>
        <strong>{formatearPesos(esperadoCentavos / 100)}</strong>
      </div>
      <label className="campo-formulario">
        Efectivo contado
        <input
          className="entrada-formulario arqueo-caja__contado"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={contadoTexto}
          onChange={(evento) => setContadoTexto(evento.target.value)}
          placeholder="Contá la caja y anotá el total"
        />
      </label>
      {diferencia ? (
        <div className={`diferencia-caja diferencia-caja--${diferencia.estado}`} role="status">
          <span>{TEXTO_DIFERENCIA[diferencia.estado]}</span>
          <strong>{formatearPesos(Math.abs(diferencia.diferencia) / 100)}</strong>
        </div>
      ) : null}
      <label className="campo-formulario">
        Observaciones (opcional)
        <textarea
          className="entrada-formulario arqueo-caja__observaciones"
          maxLength={500}
          rows={2}
          value={observaciones}
          onChange={(evento) => setObservaciones(evento.target.value)}
        />
      </label>
      {pendientes.sinEnviar > 0 ? (
        <p className="aviso-caja" role="alert">
          Hay {pendientes.sinEnviar} {pendientes.sinEnviar === 1 ? "venta" : "ventas"} de este día
          sin sincronizar en este celular. Conectate antes de cerrar.
        </p>
      ) : null}
      {pendientes.enRevision > 0 ? (
        <p className="aviso-caja">
          Hay {pendientes.enRevision} {pendientes.enRevision === 1 ? "venta" : "ventas"} de este día
          que requieren revisión y no van a entrar en el cierre.
        </p>
      ) : null}
      <Boton
        className="arqueo-caja__cerrar"
        disabled={!puedeCerrar}
        onClick={() => setConfirmando(true)}
      >
        Cerrar caja
      </Boton>
      <ConfirmarAccion
        abierto={confirmando}
        titulo="Cerrar caja"
        mensaje={
          diferencia
            ? `Se guardará el cierre con ${formatearPesos(contado ?? 0)} contados (${TEXTO_DIFERENCIA[diferencia.estado].toLowerCase()}${diferencia.diferencia ? ` de ${formatearPesos(Math.abs(diferencia.diferencia) / 100)}` : ""}). Después no se puede modificar.`
            : ""
        }
        textoConfirmar="Cerrar caja"
        variantConfirmar="primario"
        confirmando={cerrando}
        alConfirmar={() => void cerrar()}
        alCancelar={() => setConfirmando(false)}
      />
    </section>
  );
}
