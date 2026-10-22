"use client";

import { useState, type ReactElement } from "react";

import { buscarPosiblesDuplicados } from "@/features/products/lib/normalizar-nombre-producto";
import { Boton } from "@/shared/ui/Boton";
import {
  CATEGORIAS,
  type CategoriaProducto,
  type DatosProducto,
  type Producto,
} from "@/shared/types/producto";

export function FormularioProducto({
  producto,
  productosExistentes = [],
  onGuardar,
  onCancelar,
}: {
  producto?: Producto;
  /** Catálogo cargado (activos e inactivos), para avisar de posibles duplicados al crear. */
  productosExistentes?: readonly Producto[];
  onGuardar: (datos: DatosProducto) => Promise<string | null | void> | string | null | void;
  onCancelar?: () => void;
}): ReactElement {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [categoria, setCategoria] = useState<CategoriaProducto>(producto?.categoria ?? "VARIOS");
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [codigoBarras, setCodigoBarras] = useState(producto?.codigoBarras ?? "");
  const [parecidos, setParecidos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const precioValido = Number.isFinite(Number(precio)) && Number(precio) > 0;
  const puedeGuardar = nombre.trim().length > 0 && precio.trim().length > 0 && precioValido;

  const guardar = async (confirmarParecidos = false) => {
    if (!puedeGuardar || guardando) return;
    if (!producto && !confirmarParecidos) {
      const posibles = buscarPosiblesDuplicados(nombre, productosExistentes);
      if (posibles.length > 0) {
        setParecidos(posibles);
        return;
      }
    }
    setParecidos([]);
    setGuardando(true);
    const errorGuardar = await onGuardar({
      nombre,
      precio: Number(precio),
      categoria,
      marca: marca.trim() || null,
      codigoBarras: codigoBarras.trim() || null,
    });
    setGuardando(false);
    setError(errorGuardar || null);
    if (!errorGuardar) {
      setNombre("");
      setPrecio("");
      setCategoria("VARIOS");
      setMarca("");
      setCodigoBarras("");
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
            setParecidos([]);
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
          inputMode="decimal"
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

      <label className="campo-formulario">
        Categoría
        <select
          className="entrada-formulario"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value as CategoriaProducto)}
        >
          {CATEGORIAS.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="campo-formulario">
        Marca (opcional)
        <input
          value={marca}
          maxLength={80}
          onChange={(event) => setMarca(event.target.value)}
          className="entrada-formulario"
          placeholder="Ej: Arcor"
        />
      </label>

      <label className="campo-formulario">
        Código de barras (opcional)
        <input
          value={codigoBarras}
          inputMode="numeric"
          maxLength={32}
          onChange={(event) => {
            setCodigoBarras(event.target.value);
            setError(null);
          }}
          className="entrada-formulario"
          placeholder="Solo números"
        />
      </label>

      {parecidos.length > 0 ? (
        <div className="aviso-duplicado" role="alert">
          <p>
            Ya existe algo parecido:{" "}
            {parecidos
              .map((parecido) => `${parecido.nombre}${parecido.activo ? "" : " (inactivo)"}`)
              .join(", ")}
            . ¿Crear igual?
          </p>
          <div className="acciones-formulario">
            <Boton onClick={() => void guardar(true)} cargando={guardando}>
              Crear igual
            </Boton>
            <Boton variant="secundario" onClick={() => setParecidos([])}>
              Revisar
            </Boton>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="error-campo" role="alert">
          {error}
        </p>
      ) : null}

      <div className="acciones-formulario">
        <Boton onClick={() => void guardar()} disabled={!puedeGuardar} cargando={guardando}>
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
