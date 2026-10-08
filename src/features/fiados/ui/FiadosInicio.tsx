"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { cobrarVentaPuntual } from "@/features/fiados/actions/registrar-pago";
import { cerrarDiaManualmente } from "@/features/fiados/actions/cerrar-dia-manualmente";
import {
  listarVencidasDelDia,
  type VentaVencida,
} from "@/features/fiados/actions/listar-vencidas-del-dia";
import type { ClienteConSaldo } from "@/features/fiados/actions/listar-clientes-con-saldo";
import type { VentaACobrarHoy } from "@/features/fiados/actions/listar-a-cobrar-hoy";
import { formatearPesos } from "@/shared/lib/moneda";
import { useToast } from "@/shared/ui/use-toast";

function fechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export function FiadosInicio({
  clientes,
  ventasACobrarHoy,
}: {
  clientes: ClienteConSaldo[];
  ventasACobrarHoy: VentaACobrarHoy[];
}): ReactElement {
  const [medio, setMedio] = useState<"EFECTIVO" | "TRANSFERENCIA">("TRANSFERENCIA");
  const [ventaCobrando, setVentaCobrando] = useState<number | null>(null);
  const [ventasParaCerrar, setVentasParaCerrar] = useState<VentaVencida[]>([]);
  const [cargandoCierre, setCargandoCierre] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const clavesVentas = useRef(new Map<number, string>());
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { mostrar } = useToast();
  const totalDeuda = clientes.reduce((total, cliente) => total + cliente.saldo, 0);
  const totalACobrarHoy = ventasACobrarHoy.reduce((total, venta) => total + venta.saldo, 0);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (dialogoAbierto && !elemento.open) elemento.showModal();
    if (!dialogoAbierto && elemento.open) elemento.close();
  }, [dialogoAbierto]);

  const cerrarDialogo = () => {
    if (dialogo.current?.open) dialogo.current.close();
    setDialogoAbierto(false);
  };

  const cobrar = async (venta: VentaACobrarHoy) => {
    if (!navigator.onLine) {
      mostrar("Conectate a internet para registrar el cobro.", "error");
      return;
    }
    if (typeof crypto === "undefined" || !crypto.randomUUID) {
      mostrar("No se pudo preparar el pago. Probá de nuevo.", "error");
      return;
    }
    const clave = clavesVentas.current.get(venta.id) ?? crypto.randomUUID();
    clavesVentas.current.set(venta.id, clave);
    setVentaCobrando(venta.id);
    try {
      const resultado = await cobrarVentaPuntual(venta.id, medio, clave);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      clavesVentas.current.delete(venta.id);
      mostrar("Venta marcada como cobrada.");
      router.refresh();
    } catch (error) {
      console.error("fiados.FiadosInicio.cobrar", error);
      mostrar("No se pudo conectar para registrar el cobro.", "error");
    } finally {
      setVentaCobrando(null);
    }
  };

  const prepararCierre = async () => {
    if (!navigator.onLine) {
      mostrar("Conectate a internet para cerrar el día.", "error");
      return;
    }
    setCargandoCierre(true);
    try {
      const resultado = await listarVencidasDelDia();
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      setVentasParaCerrar(resultado.data);
      setDialogoAbierto(true);
    } catch (error) {
      console.error("fiados.FiadosInicio.prepararCierre", error);
      mostrar("No se pudo consultar qué ventas van a pasar a fiados.", "error");
    } finally {
      setCargandoCierre(false);
    }
  };

  const cerrar = async () => {
    if (cerrando) return;
    setCerrando(true);
    try {
      const resultado = await cerrarDiaManualmente();
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      setDialogoAbierto(false);
      mostrar(
        resultado.data === 1
          ? "1 venta pasó a la cuenta mensual."
          : `${resultado.data} ventas pasaron a la cuenta mensual.`,
      );
      router.refresh();
    } catch (error) {
      console.error("fiados.FiadosInicio.cerrar", error);
      mostrar("No se pudo cerrar el día.", "error");
    } finally {
      setCerrando(false);
    }
  };

  return (
    <div className="fiados-inicio">
      <section className="fiados-resumen" aria-label="Resumen de fiados">
        <article className="fiados-resumen__hoy">
          <span>Por cobrar hoy</span>
          <strong>{formatearPesos(totalACobrarHoy)}</strong>
          <small>
            {ventasACobrarHoy.length === 1
              ? "1 venta pendiente"
              : `${ventasACobrarHoy.length} ventas pendientes`}
          </small>
        </article>
        <article>
          <span>Deuda total</span>
          <strong>{formatearPesos(totalDeuda)}</strong>
          <small>
            {clientes.length === 1
              ? "1 cliente con saldo"
              : `${clientes.length} clientes con saldo`}
          </small>
        </article>
      </section>

      <section className="fiados-por-cobrar" aria-labelledby="a-cobrar-hoy-titulo">
        <div className="fiados-seccion__encabezado">
          <div>
            <h2 id="a-cobrar-hoy-titulo">
              A cobrar hoy <span className="fiados-contador">{ventasACobrarHoy.length}</span>
            </h2>
            <p>Ventas que todavía esperan transferencia o pago.</p>
          </div>
          <label className="campo-formulario fiados-medio">
            Medio recibido
            <select
              className="entrada-formulario"
              value={medio}
              onChange={(event) =>
                setMedio(event.target.value === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA")
              }
            >
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </label>
        </div>
        {ventasACobrarHoy.length === 0 ? (
          <p className="estado-vacio">No tenés ventas pendientes de cobro para hoy.</p>
        ) : (
          <div className="lista-ventas">
            {ventasACobrarHoy.map((venta) => (
              <article className="venta-por-cobrar" key={venta.id}>
                <div>
                  <Link href={`/fiados/${venta.clienteFiadoId}`}>{venta.cliente}</Link>
                  <small>Venta de hoy · {fechaHora(venta.fecha)}</small>
                </div>
                <strong className="venta-por-cobrar__saldo">
                  {formatearPesos(venta.saldo)}
                  <small>pendiente</small>
                </strong>
                <button
                  type="button"
                  className="boton boton--primario"
                  disabled={ventaCobrando !== null || cerrando}
                  onClick={() => void cobrar(venta)}
                >
                  {ventaCobrando === venta.id ? "Guardando…" : "Marcar como cobrada"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="fiados-cuentas" aria-labelledby="cuentas-clientes-titulo">
        <div className="fiados-seccion__encabezado">
          <div>
            <h2 id="cuentas-clientes-titulo">
              Cuentas corrientes <span className="fiados-contador">{clientes.length}</span>
            </h2>
            <p>Clientes ordenados por saldo, de mayor a menor.</p>
          </div>
          <button
            type="button"
            className="boton boton--secundario"
            disabled={cargandoCierre || cerrando}
            onClick={() => void prepararCierre()}
          >
            {cargandoCierre ? "Consultando…" : "Cerrar el día"}
          </button>
        </div>
        {clientes.length === 0 ? (
          <div className="fiados-vacio">
            <strong>Todavía no hay cuentas con saldo.</strong>
            <p>Cuando registres una compra fiada, la cuenta del cliente va a aparecer acá.</p>
          </div>
        ) : (
          <div className="lista-ventas">
            {clientes.map((cliente) => (
              <Link className="cliente-con-saldo" href={`/fiados/${cliente.id}`} key={cliente.id}>
                <span className="cliente-con-saldo__identidad">
                  <strong>{cliente.nombre}</strong>
                  <small>
                    Ver cuenta y movimientos <span aria-hidden="true">→</span>
                  </small>
                </span>
                <span className="cliente-con-saldo__importe">
                  <small>Saldo pendiente</small>
                  <strong>{formatearPesos(cliente.saldo)}</strong>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <dialog
        ref={dialogo}
        className="dialogo-confirmacion dialogo-cierre-dia"
        aria-labelledby="cierre-dia-titulo"
        onCancel={(event) => {
          event.preventDefault();
          cerrarDialogo();
        }}
        onClose={() => {
          setDialogoAbierto(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) cerrarDialogo();
        }}
      >
        <h2 id="cierre-dia-titulo">Cerrar el día</h2>
        <p>Las ventas que sigan sin cobrar pasarán a la cuenta mensual de cada cliente.</p>
        {ventasParaCerrar.length === 0 ? (
          <p>No hay ventas por cobrar para pasar a fiados.</p>
        ) : (
          <ul className="lista-cierre-dia">
            {ventasParaCerrar.map((venta) => (
              <li key={venta.id}>
                <span>{venta.cliente}</span>
                <strong>{formatearPesos(venta.total)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="dialogo-confirmacion__acciones">
          <button
            type="button"
            className="boton boton--secundario"
            disabled={cerrando}
            onClick={cerrarDialogo}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="boton boton--primario"
            disabled={cerrando || ventasParaCerrar.length === 0}
            onClick={() => void cerrar()}
          >
            {cerrando ? "Cerrando…" : "Confirmar cierre"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
