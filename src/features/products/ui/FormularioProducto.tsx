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
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium text-slate-700">
        Nombre
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-300 px-3"
          placeholder="Ej: Galletas"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Precio
        <input
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(event) => setPrecio(event.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-300 px-3"
          placeholder="0.00"
        />
      </label>

      <div className="flex gap-3">
        <Boton onClick={guardar} disabled={!puedeGuardar} className="flex-1">
          {producto ? "Guardar cambios" : "Crear producto"}
        </Boton>
        {onCancelar ? (
          <Boton variant="secundario" onClick={onCancelar} className="flex-1">
            Cancelar
          </Boton>
        ) : null}
      </div>
    </div>
  );
}
