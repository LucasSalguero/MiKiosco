"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { anularMovimientoCaja } from "@/features/cash-register/actions/anular-movimiento-caja";
import { registrarMovimientoCaja } from "@/features/cash-register/actions/registrar-movimiento-caja";
import { ZONA_HORARIA } from "@/shared/lib/fechas";
import { formatearPesos } from "@/shared/lib/moneda";
import type { MovimientoCaja, TipoMovimientoCaja } from "@/shared/types/caja";
import { Boton } from "@/shared/ui/Boton";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { useToast } from "@/shared/ui/use-toast";

const TIPOS: Array<{ tipo: TipoMovimientoCaja; etiqueta: string; ayuda: string }> = [
  { tipo: "EGRESO", etiqueta: "Egreso", ayuda: "Pago a proveedor o gasto" },
  { tipo: "RETIRO", etiqueta: "Retiro", ayuda: "El dueño saca efectivo" },
  { tipo: "INGRESO", etiqueta: "Ingreso", ayuda: "Aporte de efectivo que no es venta" },
];

const etiquetaTipo = (tipo: TipoMovimientoCaja) =>
  TIPOS.find((opcion) => opcion.tipo === tipo)?.etiqueta ?? tipo;

const nuevaClave = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "";

export function MovimientosCaja({
  movimientos,
  puedeRegistrar,
  puedeAnular,
}: {
  movimientos: MovimientoCaja[];
  puedeRegistrar: boolean;
  puedeAnular: boolean;
}): ReactElement {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimientoCaja>("EGRESO");
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [porAnular, setPorAnular] = useState<MovimientoCaja | null>(null);
  const [anulando, setAnulando] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { mostrar } = useToast();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  const abrir = () => {
    // La clave se genera al abrir el formulario: si se reintenta el mismo envío, no se duplica.
    setClave(nuevaClave());
    setAbierto(true);
  };

  const registrar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      const resultado = await registrarMovimientoCaja(tipo, Number(monto), motivo, clave);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      mostrar(`${etiquetaTipo(tipo)} registrado.`);
      setMonto("");
      setMotivo("");
      setAbierto(false);
      router.refresh();
    } catch (error) {
      console.error("cash-register.registrarMovimientoCaja", error);
      mostrar("No se pudo registrar el movimiento. Revisá la conexión.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const anular = async () => {
    if (!porAnular) return;
    setAnulando(true);
    try {
      const resultado = await anularMovimientoCaja(porAnular.id);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      mostrar("Movimiento anulado.");
      setPorAnular(null);
      router.refresh();
    } catch (error) {
      console.error("cash-register.anularMovimientoCaja", error);
      mostrar("No se pudo anular el movimiento. Revisá la conexión.", "error");
    } finally {
      setAnulando(false);
    }
  };

  return (
    <section className="seccion-caja" aria-labelledby="movimientos-titulo">
      <div className="seccion-caja__encabezado">
        <h2 id="movimientos-titulo">Movimientos del día</h2>
        {puedeRegistrar ? (
          <Boton variant="secundario" onClick={abrir}>
            Registrar egreso o retiro
          </Boton>
        ) : null}
      </div>
      {movimientos.length === 0 ? (
        <p className="estado-vacio">No hay egresos, retiros ni ingresos.</p>
      ) : (
        <ul className="lista-movimientos-caja">
          {movimientos.map((movimiento) => (
            <li
              key={movimiento.id}
              className={`movimiento-caja${movimiento.anulado ? " movimiento-caja--anulado" : ""}`}
            >
              <div>
                <strong>{etiquetaTipo(movimiento.tipo)}</strong>
                <span>{movimiento.motivo}</span>
                <small>
                  {new Intl.DateTimeFormat("es-AR", {
                    timeZone: ZONA_HORARIA,
                    timeStyle: "short",
                  }).format(new Date(movimiento.fecha))}
                  {movimiento.anulado ? " · Anulado" : ""}
                </small>
              </div>
              <strong className={`movimiento-caja__monto--${movimiento.tipo.toLowerCase()}`}>
                {movimiento.tipo === "INGRESO" ? "+" : "−"}
                {formatearPesos(movimiento.monto)}
              </strong>
              {puedeAnular && !movimiento.anulado ? (
                <button
                  type="button"
                  className="boton boton--secundario movimiento-caja__anular"
                  onClick={() => setPorAnular(movimiento)}
                >
                  Anular
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogo}
        className="dialogo-confirmacion"
        aria-labelledby="dialogo-movimiento-titulo"
        onCancel={(evento) => {
          evento.preventDefault();
          setAbierto(false);
        }}
      >
        <form className="formulario-movimiento" onSubmit={registrar}>
          <h2 id="dialogo-movimiento-titulo">Registrar movimiento</h2>
          <fieldset className="opciones-movimiento">
            <legend>Tipo</legend>
            {TIPOS.map((opcion) => (
              <label key={opcion.tipo}>
                <input
                  type="radio"
                  name="tipo-movimiento"
                  checked={tipo === opcion.tipo}
                  onChange={() => setTipo(opcion.tipo)}
                />
                <span>
                  <strong>{opcion.etiqueta}</strong>
                  <small>{opcion.ayuda}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="campo-formulario">
            Importe
            <input
              className="entrada-formulario"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
              placeholder="$ 0"
            />
          </label>
          <label className="campo-formulario">
            Motivo
            <input
              className="entrada-formulario"
              type="text"
              maxLength={160}
              required
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ej: pago a distribuidora"
            />
          </label>
          <div className="dialogo-confirmacion__acciones">
            <Boton variant="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
            <button className="boton boton--primario" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </form>
      </dialog>

      <ConfirmarAccion
        abierto={Boolean(porAnular)}
        titulo="Anular movimiento"
        mensaje={
          porAnular
            ? `Se anulará el ${etiquetaTipo(porAnular.tipo).toLowerCase()} de ${formatearPesos(porAnular.monto)}.`
            : ""
        }
        textoConfirmar="Anular"
        confirmando={anulando}
        alConfirmar={() => void anular()}
        alCancelar={() => setPorAnular(null)}
      />
    </section>
  );
}
