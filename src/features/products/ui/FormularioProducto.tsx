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
  onGuardar: (datos: DatosProducto) => Promise<void> | void;
  onCancelar?: () => void;
}): ReactElement {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const precioValido = Number.isFinite(Number(precio)) && Number(precio) >= 0;
  const puedeGuardar = nombre.trim().length > 0 && precio.trim().length > 0 && precioValido;

  const guardar = async () => {
    await onGuardar({ nombre, precio: Number(precio) });
  };

  return (
    <div className="formulario-producto">
      <label className="campo-formulario">
        Nombre
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="entrada-formulario"
          placeholder="Ej: Galletas"
        />
      </label>

      <label className="campo-formulario">
        Precio
        <input
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(event) => setPrecio(event.target.value)}
          className="entrada-formulario"
          placeholder="0.00"
        />
      </label>

      <div className="acciones-formulario">
        <Boton onClick={guardar} disabled={!puedeGuardar}>
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
