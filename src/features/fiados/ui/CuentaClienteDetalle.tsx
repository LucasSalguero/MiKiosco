"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { anularPago } from "@/features/fiados/actions/anular-pago";
import { cobrarVentaPuntual, registrarPago } from "@/features/fiados/actions/registrar-pago";
import type {
  CuentaCliente,
  MovimientoCuenta,
} from "@/features/fiados/actions/obtener-cuenta-cliente";
import { formatearPesos } from "@/shared/lib/moneda";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { useToast } from "@/shared/ui/use-toast";

function fechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export function CuentaClienteDetalle({ cuenta }: { cuenta: CuentaCliente }): ReactElement {
  const [importe, setImporte] = useState("");
  const [medio, setMedio] = useState<"EFECTIVO" | "TRANSFERENCIA">("EFECTIVO");
  const [guardando, setGuardando] = useState(false);
  const [pagoCobrando, setPagoCobrando] = useState<number | null>(null);
  const [pagoPorAnular, setPagoPorAnular] = useState<number | null>(null);
  const [anulando, setAnulando] = useState(false);
  const claveActual = useRef<{ firma: string; clave: string } | null>(null);
  const clavesVentas = useRef(new Map<number, string>());
  const router = useRouter();
  const { mostrar } = useToast();

  const crearClave = (firma: string): string | null => {
    if (claveActual.current?.firma === firma) return claveActual.current.clave;
    if (typeof crypto === "undefined" || !crypto.randomUUID) return null;
    const clave = crypto.randomUUID();
    claveActual.current = { firma, clave };
    return clave;
  };

  const registrarPagoCliente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!navigator.onLine) {
      mostrar("Conectate a internet para registrar un pago.", "error");
      return;
    }
    const monto = Number(importe);
    const claveOperacion = crearClave(`${cuenta.cliente.id}:${monto}:${medio}`);
    if (!claveOperacion) {
      mostrar("No se pudo preparar el pago. Probá de nuevo.", "error");
      return;
    }
    setGuardando(true);
    try {
      const resultado = await registrarPago(cuenta.cliente.id, monto, medio, claveOperacion);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      claveActual.current = null;
      setImporte("");
      mostrar(
        resultado.data.saldo === 0
          ? "Cuenta cancelada."
          : `Pago registrado. Saldo restante: ${formatearPesos(resultado.data.saldo)}.`,
      );
      router.refresh();
    } catch (error) {
      console.error("fiados.CuentaClienteDetalle.registrarPago", error);
      mostrar("No se pudo conectar para registrar el pago.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const cobrarVenta = async (ventaId: number) => {
    if (!navigator.onLine) {
      mostrar("Conectate a internet para marcar una venta como cobrada.", "error");
      return;
    }
    if (typeof crypto === "undefined" || !crypto.randomUUID) {
      mostrar("No se pudo preparar el pago. Probá de nuevo.", "error");
      return;
    }
    const clave = clavesVentas.current.get(ventaId) ?? crypto.randomUUID();
    clavesVentas.current.set(ventaId, clave);
    setPagoCobrando(ventaId);
    try {
      const resultado = await cobrarVentaPuntual(ventaId, medio, clave);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      clavesVentas.current.delete(ventaId);
      mostrar("Venta marcada como cobrada.");
      router.refresh();
    } catch (error) {
      console.error("fiados.CuentaClienteDetalle.cobrarVenta", error);
      mostrar("No se pudo conectar para registrar el cobro.", "error");
    } finally {
      setPagoCobrando(null);
    }
  };

  const confirmarAnulacionPago = async () => {
    if (pagoPorAnular === null) return;
    if (!navigator.onLine) {
      mostrar("Conectate a internet para anular un pago.", "error");
      return;
    }
    setAnulando(true);
    try {
      const resultado = await anularPago(pagoPorAnular);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      mostrar("Pago anulado.");
      setPagoPorAnular(null);
      router.refresh();
    } catch (error) {
      console.error("fiados.CuentaClienteDetalle.anularPago", error);
      mostrar("No se pudo anular el pago.", "error");
    } finally {
      setAnulando(false);
    }
  };

  const movimiento = (item: MovimientoCuenta): ReactElement => {
    if (item.tipo === "VENTA") {
      return (
        <article className="movimiento-cuenta movimiento-cuenta--venta" key={`venta-${item.id}`}>
          <div className="movimiento-cuenta__encabezado">
            <div>
              <strong>Compra · {fechaHora(item.fecha)}</strong>
              <small>
                {item.estadoPago === "A_COBRAR_HOY" ? "A cobrar hoy" : "Cuenta mensual"}
              </small>
            </div>
            <strong>{formatearPesos(item.monto)}</strong>
          </div>
          <ul>
            {item.items.map((producto) => (
              <li key={producto.id}>
                {producto.cantidad}x {producto.nombre} · {formatearPesos(producto.precioUnitario)}
              </li>
            ))}
          </ul>
          {item.autorizadaPor ? <p>Autorizó: {item.autorizadaPor}</p> : null}
          {item.saldoPendiente > 0 ? (
            <p>Saldo de esta venta: {formatearPesos(item.saldoPendiente)}</p>
          ) : (
            <p className="etiqueta-cobrada">Cobrada</p>
          )}
          {item.saldoPendiente > 0 ? (
            <button
              type="button"
              className="boton boton--primario"
              disabled={pagoCobrando !== null}
              onClick={() => void cobrarVenta(item.id)}
            >
              {pagoCobrando === item.id ? "Guardando…" : "Marcar como cobrada"}
            </button>
          ) : null}
        </article>
      );
    }

    return (
      <article
        className={`movimiento-cuenta movimiento-cuenta--pago${item.anulado ? " movimiento-cuenta--anulado" : ""}`}
        key={`pago-${item.id}`}
      >
        <div className="movimiento-cuenta__encabezado">
          <div>
            <strong>Pago · {fechaHora(item.fecha)}</strong>
            <small>{item.medio === "DESCONOCIDO" ? "Medio no registrado" : item.medio}</small>
          </div>
          <strong>{formatearPesos(item.monto)}</strong>
        </div>
        {item.anulado ? (
          <span className="etiqueta-anulada">Anulado</span>
        ) : (
          <button
            type="button"
            className="boton boton--peligro"
            onClick={() => setPagoPorAnular(item.id)}
          >
            Anular pago
          </button>
        )}
      </article>
    );
  };

  return (
    <main className="cuenta-cliente-pagina">
      <Link className="enlace-volver" href="/fiados">
        ← Volver a Fiados
      </Link>
      <header className="cuenta-cliente-pagina__encabezado">
        <div>
          <p className="marca">Cuenta corriente</p>
          <h1>{cuenta.cliente.nombre}</h1>
          {cuenta.cliente.telefono ? <p>{cuenta.cliente.telefono}</p> : null}
        </div>
        <strong>Saldo {formatearPesos(cuenta.saldo)}</strong>
      </header>

      {cuenta.saldo > 0 ? (
        <section className="registrar-pago">
          <h2>Registrar pago</h2>
          <p>Los pagos se registran con conexión a internet.</p>
          <form className="formulario-pago" onSubmit={(event) => void registrarPagoCliente(event)}>
            <label className="campo-formulario">
              Importe
              <input
                className="entrada-formulario"
                type="number"
                min="0.01"
                max={cuenta.saldo}
                step="0.01"
                inputMode="decimal"
                required
                value={importe}
                onChange={(event) => setImporte(event.target.value)}
                placeholder={cuenta.saldo.toFixed(2)}
              />
            </label>
            <label className="campo-formulario">
              Medio de pago
              <select
                className="entrada-formulario"
                value={medio}
                onChange={(event) =>
                  setMedio(event.target.value === "TRANSFERENCIA" ? "TRANSFERENCIA" : "EFECTIVO")
                }
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </label>
            <button type="submit" className="boton boton--primario" disabled={guardando}>
              {guardando ? "Guardando…" : "Registrar pago"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="historial-cuenta" aria-label="Historial de compras y pagos">
        <h2>Movimientos</h2>
        {cuenta.movimientos.length === 0 ? (
          <p className="estado-vacio">Esta cuenta todavía no tiene movimientos.</p>
        ) : (
          <div className="lista-movimientos-cuenta">{cuenta.movimientos.map(movimiento)}</div>
        )}
      </section>
      <ConfirmarAccion
        abierto={pagoPorAnular !== null}
        titulo="Anular pago"
        mensaje="El pago dejará de descontarse del saldo de este cliente."
        textoConfirmar="Anular pago"
        confirmando={anulando}
        alConfirmar={() => void confirmarAnulacionPago()}
        alCancelar={() => setPagoPorAnular(null)}
      />
    </main>
  );
}
