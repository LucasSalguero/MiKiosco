"use client";

import { useState, type ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";
import type { DatosProducto, Producto } from "@/shared/types/producto";

export function FormularioProducto({
  producto,
  onGuardar,
  onCancelar,
}: {
  producto?: Producto;
  onGuardar: (datos: DatosProducto) => Promise<string | null | void> | string | null | void;
  onCancelar?: () => void;
}): ReactElement {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const precioValido = Number.isFinite(Number(precio)) && Number(precio) > 0;
  const puedeGuardar = nombre.trim().length > 0 && precio.trim().length > 0 && precioValido;

  const guardar = async () => {
    if (!puedeGuardar || guardando) return;
    setGuardando(true);
    const errorGuardar = await onGuardar({ nombre, precio: Number(precio) });
    setGuardando(false);
    setError(errorGuardar || null);
    if (!errorGuardar) {
      setNombre("");
      setPrecio("");
    }
  };

  return (
    <div className="formulario-producto">
      <label className="campo-formulario">
        Nombre
        <input
          value={nombre}
          onChange={(event) => {
            setNombre(event.target.value);
            setError(null);
          }}
          className="entrada-formulario"
          placeholder="Ej: Galletas"
        />
      </label>

      <label className="campo-formulario">
        Precio
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={precio}
          onChange={(event) => {
            setPrecio(event.target.value);
            setError(null);
          }}
          className="entrada-formulario"
          placeholder="0.00"
          aria-invalid={precio.length > 0 && !precioValido}
          aria-describedby="error-precio"
        />
        {precio.length > 0 && !precioValido ? (
          <span id="error-precio" className="error-campo" role="alert">
            El precio debe ser mayor a cero.
          </span>
        ) : null}
      </label>

      {error ? (
        <p className="error-campo" role="alert">
          {error}
        </p>
      ) : null}

      <div className="acciones-formulario">
        <Boton onClick={guardar} disabled={!puedeGuardar} cargando={guardando}>
          {producto ? "Guardar cambios" : "Crear producto"}
        </Boton>
        {onCancelar ? (
          <Boton variant="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        ) : null}
      </div>
    </div>
  );
}
