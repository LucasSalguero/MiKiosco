"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { formatearPesos } from "@/shared/lib/moneda";
import type { ItemNuevaVenta, TipoPago } from "@/shared/types/venta";

export function CarritoVenta({
  items,
  total,
  onCambiarCantidad,
  onQuitar,
  onAgregarConcepto,
  onCobrar,
  cobrando,
}: {
  items: ItemNuevaVenta[];
  total: number;
  onCambiarCantidad: (indice: number, cantidad: number) => void;
  onQuitar: (indice: number) => void;
  onAgregarConcepto: (descripcion: string, importe: number) => void;
  onCobrar: (tipoPago: TipoPago, clienteNombre: string) => Promise<boolean>;
  cobrando?: boolean;
}): ReactElement {
  const [importeRapido, setImporteRapido] = useState("");
  const [descripcionRapida, setDescripcionRapida] = useState("");
  const [tipoPago, setTipoPago] = useState<TipoPago>("CONTADO");
  const [clienteNombre, setClienteNombre] = useState("");
  const agregarConcepto = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const importe = Number(importeRapido);
    if (!Number.isFinite(importe) || importe <= 0) return;
    onAgregarConcepto(descripcionRapida, importe);
    setImporteRapido("");
    setDescripcionRapida("");
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
        <div className="opciones-pago" role="group" aria-label="Método de pago">
          <button
            type="button"
            className={tipoPago === "CONTADO" ? "opcion-pago activa" : "opcion-pago"}
            aria-pressed={tipoPago === "CONTADO"}
            onClick={() => setTipoPago("CONTADO")}
          >
            Contado
          </button>
          <button
            type="button"
            className={tipoPago === "FIADO" ? "opcion-pago activa" : "opcion-pago"}
            aria-pressed={tipoPago === "FIADO"}
            onClick={() => setTipoPago("FIADO")}
          >
            Fiado
          </button>
        </div>
        {tipoPago === "FIADO" ? (
          <label className="campo-formulario campo-cliente-fiado">
            Nombre del cliente
            <input
              className="entrada-formulario"
              type="text"
              maxLength={120}
              required
              value={clienteNombre}
              onChange={(event) => setClienteNombre(event.target.value)}
              placeholder="Nombre y apellido"
            />
          </label>
        ) : null}
        <div>
          <span>Total a cobrar</span>
          <strong>{formatearPesos(total)}</strong>
        </div>
        <button
          type="button"
          className="boton-cobrar"
          disabled={
            items.length === 0 || cobrando || (tipoPago === "FIADO" && !clienteNombre.trim())
          }
          onClick={async () => {
            const guardada = await onCobrar(tipoPago, clienteNombre.trim());
            if (guardada) {
              setTipoPago("CONTADO");
              setClienteNombre("");
            }
          }}
        >
          {cobrando
            ? "Guardando…"
            : tipoPago === "FIADO"
              ? `Registrar fiado ${formatearPesos(total)}`
              : `Cobrar ${formatearPesos(total)}`}
        </button>
      </div>
    </aside>
  );
}
