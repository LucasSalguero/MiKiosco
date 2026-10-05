"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { registrarCobroFiado } from "@/features/credit/actions/registrar-cobro-fiado";
import type { CuentaCorriente } from "@/features/credit/actions/obtener-cuentas-corrientes";
import { ZONA_HORARIA } from "@/shared/lib/fechas";
import { formatearPesos } from "@/shared/lib/moneda";
import { useToast } from "@/shared/ui/use-toast";

function fechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export function CuentasCorrientes({ cuentas }: { cuentas: CuentaCorriente[] }): ReactElement {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [importes, setImportes] = useState<Record<number, string>>({});
  const [cobrando, setCobrando] = useState<number | null>(null);
  const router = useRouter();
  const { mostrar } = useToast();

  const cobrar = async (event: FormEvent<HTMLFormElement>, ventaId: number) => {
    event.preventDefault();
    if (cobrando !== null) return;
    if (!navigator.onLine) {
      mostrar("Conectate a internet para registrar un cobro.", "error");
      return;
    }
    setCobrando(ventaId);
    let resultado: Awaited<ReturnType<typeof registrarCobroFiado>>;
    try {
      resultado = await registrarCobroFiado(ventaId, Number(importes[ventaId]));
    } catch (error) {
      console.error("credit.CuentasCorrientes.cobrar", error);
      setCobrando(null);
      mostrar("No se pudo conectar para registrar el cobro.", "error");
      return;
    }
    setCobrando(null);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    mostrar(
      resultado.data.saldoPendiente === 0
        ? "Cuenta cancelada."
        : `Cobro registrado. Saldo restante: ${formatearPesos(resultado.data.saldoPendiente)}.`,
    );
    setImportes((actual) => ({ ...actual, [ventaId]: "" }));
    router.refresh();
  };

  return (
    <section className="cuentas-corrientes" aria-label="Clientes con saldo pendiente">
      {cuentas.length === 0 ? (
        <p className="estado-vacio">No hay cuentas pendientes de cobro.</p>
      ) : (
        cuentas.map((cuenta) => (
          <article className="cuenta-cliente" key={cuenta.clienteNombre}>
            <button
              type="button"
              className="cuenta-cliente__encabezado"
              aria-expanded={abierta === cuenta.clienteNombre}
              onClick={() =>
                setAbierta(abierta === cuenta.clienteNombre ? null : cuenta.clienteNombre)
              }
            >
              <strong>{cuenta.clienteNombre}</strong>
              <span>Saldo {formatearPesos(cuenta.saldoPendiente)}</span>
            </button>
            {abierta === cuenta.clienteNombre ? (
              <div className="cuenta-cliente__ventas">
                {cuenta.ventas.map((venta) => (
                  <article className="venta-fiada" key={venta.id}>
                    <div className="venta-fiada__encabezado">
                      <strong>{fechaHora(venta.fecha)}</strong>
                      <span>{formatearPesos(venta.total)}</span>
                    </div>
                    <ul>
                      {venta.items.map((item) => (
                        <li key={item.id}>
                          {item.cantidad}x {item.nombre} · {formatearPesos(item.precioUnitario)}
                        </li>
                      ))}
                    </ul>
                    <p>
                      Cobrado {formatearPesos(venta.cobrado)} · Restante{" "}
                      {formatearPesos(venta.saldoPendiente)}
                    </p>
                    {venta.cobros.length ? (
                      <ul className="historial-cobros">
                        {venta.cobros.map((cobro) => (
                          <li key={cobro.id}>
                            Cobro {fechaHora(cobro.fecha)}: {formatearPesos(cobro.monto)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <form
                      className="formulario-cobro"
                      onSubmit={(event) => void cobrar(event, venta.id)}
                    >
                      <label className="campo-formulario">
                        Importe a cobrar
                        <input
                          className="entrada-formulario"
                          type="number"
                          min="0.01"
                          max={venta.saldoPendiente}
                          step="0.01"
                          inputMode="decimal"
                          required
                          value={importes[venta.id] ?? ""}
                          onChange={(event) =>
                            setImportes((actual) => ({
                              ...actual,
                              [venta.id]: event.target.value,
                            }))
                          }
                          placeholder={String(venta.saldoPendiente.toFixed(2))}
                        />
                      </label>
                      <button
                        className="boton boton--primario boton-cobrar-fiado"
                        type="submit"
                        disabled={cobrando !== null}
                      >
                        {cobrando === venta.id ? "Guardando…" : "Registrar cobro"}
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
