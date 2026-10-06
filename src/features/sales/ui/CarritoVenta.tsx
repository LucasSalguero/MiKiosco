"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactElement } from "react";
import { formatearPesos } from "@/shared/lib/moneda";
import { normalizarNombreCliente } from "@/features/fiados/lib/normalizar-nombre-cliente";
import type { Cliente, ItemNuevaVenta } from "@/shared/types/venta";

type DatosFiado = {
  estadoPago: "A_COBRAR_HOY" | "FIADA";
  clienteFiadoId?: number;
  clienteNuevoNombre?: string;
  autorizadaPor?: string;
  autorizacionConfirmada?: boolean;
};

export function CarritoVenta({
  items,
  total,
  clientes,
  onCambiarCantidad,
  onQuitar,
  onAgregarConcepto,
  onCobrar,
  onFiar,
  cobrando,
}: {
  items: ItemNuevaVenta[];
  total: number;
  clientes: Cliente[];
  onCambiarCantidad: (indice: number, cantidad: number) => void;
  onQuitar: (indice: number) => void;
  onAgregarConcepto: (descripcion: string, importe: number) => void;
  onCobrar: () => Promise<boolean>;
  onFiar: (datos: DatosFiado) => Promise<boolean>;
  cobrando?: boolean;
}): ReactElement {
  const [importeRapido, setImporteRapido] = useState("");
  const [descripcionRapida, setDescripcionRapida] = useState("");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [estadoPago, setEstadoPago] = useState<"A_COBRAR_HOY" | "FIADA">("A_COBRAR_HOY");
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [crearClienteNuevo, setCrearClienteNuevo] = useState(false);
  const [autorizacionConfirmada, setAutorizacionConfirmada] = useState(false);
  const [autorizadaPor, setAutorizadaPor] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const agregarConcepto = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const importe = Number(importeRapido);
    if (!Number.isFinite(importe) || importe <= 0) return;
    onAgregarConcepto(descripcionRapida, importe);
    setImporteRapido("");
    setDescripcionRapida("");
  };

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (dialogoAbierto && !elemento.open) elemento.showModal();
    if (!dialogoAbierto && elemento.open) elemento.close();
  }, [dialogoAbierto]);

  const nombreNormalizado = normalizarNombreCliente(clienteBusqueda);
  const clienteElegido = clientes.find(
    (cliente) => normalizarNombreCliente(cliente.nombre) === nombreNormalizado,
  );
  const nombreNuevo = clienteElegido && !crearClienteNuevo ? "" : clienteBusqueda.trim();
  const cobrarFiado = async () => {
    if (!nombreNormalizado) return;
    const guardada = await onFiar({
      estadoPago,
      ...(clienteElegido
        ? { clienteFiadoId: clienteElegido.id }
        : { clienteNuevoNombre: nombreNuevo }),
      ...(estadoPago === "FIADA" ? { autorizadaPor, autorizacionConfirmada } : {}),
    });
    if (guardada) {
      setClienteBusqueda("");
      setCrearClienteNuevo(false);
      setEstadoPago("A_COBRAR_HOY");
      setAutorizacionConfirmada(false);
      setAutorizadaPor("");
      setDialogoAbierto(false);
    }
  };

  return (
    <aside className="carrito" aria-label="Pedido actual">
      <div className="carrito-titulo">
        <h2>Pedido</h2>
        <span>{items.reduce((cantidad, item) => cantidad + item.cantidad, 0)} productos</span>
      </div>
      {items.length === 0 ? (
        <p className="estado-vacio">Tocá un producto para agregarlo.</p>
      ) : (
        <div className="items-carrito">
          {items.map((item, indice) => (
            <div key={`${item.productoId ?? "manual"}-${indice}`} className="item-carrito">
              <div>
                <strong>{item.productoNombre}</strong>
                <small>{formatearPesos(item.precioUnitario)} c/u</small>
              </div>
              <div className="cantidad">
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${item.productoNombre}`}
                  onClick={() => onCambiarCantidad(indice, item.cantidad - 1)}
                >
                  −
                </button>
                <span>{item.cantidad}</span>
                <button
                  type="button"
                  aria-label={`Sumar una unidad de ${item.productoNombre}`}
                  onClick={() => onCambiarCantidad(indice, item.cantidad + 1)}
                >
                  +
                </button>
              </div>
              <button
                className="quitar-item"
                type="button"
                onClick={() => onQuitar(indice)}
                aria-label={`Quitar ${item.productoNombre}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form className="venta-rapida" onSubmit={agregarConcepto}>
        <h3>Agregar monto rápido</h3>
        <label className="campo-formulario">
          Importe
          <input
            className="entrada-formulario"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={importeRapido}
            onChange={(event) => setImporteRapido(event.target.value)}
            placeholder="$ 0"
          />
        </label>
        <label className="campo-formulario">
          Descripción (opcional)
          <input
            className="entrada-formulario"
            type="text"
            maxLength={120}
            value={descripcionRapida}
            onChange={(event) => setDescripcionRapida(event.target.value)}
            placeholder="Golosinas varias"
          />
        </label>
        <button className="boton boton--secundario boton-rapido" type="submit">
          Agregar al pedido
        </button>
      </form>
      <div className="pie-carrito">
        <div>
          <span>Total</span>
          <strong>{formatearPesos(total)}</strong>
        </div>
        <button
          type="button"
          className="boton-cobrar"
          disabled={items.length === 0 || cobrando}
          onClick={() => void onCobrar()}
        >
          {cobrando ? "Guardando…" : `Cobrar ${formatearPesos(total)}`}
        </button>
        <button
          type="button"
          className="boton boton--secundario boton-fiar"
          disabled={items.length === 0 || cobrando}
          onClick={() => setDialogoAbierto(true)}
        >
          Fiar / Cobra después
        </button>
      </div>
      <dialog
        ref={dialogo}
        className="dialogo-confirmacion dialogo-fiado"
        aria-labelledby="dialogo-fiado-titulo"
        onCancel={(event) => {
          event.preventDefault();
          setDialogoAbierto(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDialogoAbierto(false);
        }}
      >
        <h2 id="dialogo-fiado-titulo">Registrar fiado</h2>
        <p>Elegí al cliente y cómo querés registrar esta deuda.</p>
        <label className="campo-formulario">
          Cliente
          <input
            className="entrada-formulario"
            type="search"
            list="clientes-fiado"
            maxLength={120}
            value={clienteBusqueda}
            onChange={(event) => {
              setClienteBusqueda(event.target.value);
              if (
                clientes.some(
                  (cliente) =>
                    normalizarNombreCliente(cliente.nombre) ===
                    normalizarNombreCliente(event.target.value),
                )
              ) {
                setCrearClienteNuevo(false);
              }
            }}
            placeholder="Buscá o escribí un nombre"
            autoComplete="off"
          />
          <datalist id="clientes-fiado">
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.nombre} />
            ))}
          </datalist>
          <small>
            {clienteElegido && !crearClienteNuevo
              ? "Cliente existente"
              : "Se guardará como cliente nuevo"}
          </small>
        </label>
        <button
          className="boton boton--secundario boton-nuevo-cliente"
          type="button"
          aria-pressed={crearClienteNuevo}
          onClick={() => {
            setCrearClienteNuevo(true);
            setClienteBusqueda("");
          }}
        >
          Nuevo cliente
        </button>
        <fieldset className="opciones-fiado">
          <legend>¿Cuándo paga?</legend>
          <label>
            <input
              type="radio"
              name="estado-fiado"
              checked={estadoPago === "A_COBRAR_HOY"}
              onChange={() => setEstadoPago("A_COBRAR_HOY")}
            />
            Transfiere hoy
          </label>
          <label>
            <input
              type="radio"
              name="estado-fiado"
              checked={estadoPago === "FIADA"}
              onChange={() => setEstadoPago("FIADA")}
            />
            Cuenta mensual
          </label>
        </fieldset>
        {estadoPago === "FIADA" ? (
          <>
            <label className="confirmacion-autorizacion">
              <input
                type="checkbox"
                checked={autorizacionConfirmada}
                onChange={(event) => setAutorizacionConfirmada(event.target.checked)}
              />
              El dueño autorizó anotar esta compra
            </label>
            <label className="campo-formulario">
              Quién autorizó (opcional)
              <input
                className="entrada-formulario"
                type="text"
                maxLength={120}
                value={autorizadaPor}
                onChange={(event) => setAutorizadaPor(event.target.value)}
              />
            </label>
          </>
        ) : null}
        <div className="dialogo-confirmacion__acciones">
          <button
            className="boton boton--secundario"
            type="button"
            onClick={() => setDialogoAbierto(false)}
          >
            Cancelar
          </button>
          <button
            className="boton boton--primario"
            type="button"
            disabled={
              !nombreNormalizado || cobrando || (estadoPago === "FIADA" && !autorizacionConfirmada)
            }
            onClick={() => void cobrarFiado()}
          >
            {cobrando ? "Guardando…" : `Registrar ${formatearPesos(total)}`}
          </button>
        </div>
      </dialog>
    </aside>
  );
}
