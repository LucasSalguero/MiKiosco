"use client";

import { useMemo, useState, type ReactElement } from "react";

import { actualizarPreciosMasivo } from "@/features/products/actions/actualizar-precios-masivo";
import {
  PORCENTAJE_MAXIMO,
  PORCENTAJE_MINIMO,
  previsualizarPrecios,
  validarActualizacionMasiva,
} from "@/features/products/lib/calcular-precios-masivos";
import { formatearPesos } from "@/shared/lib/moneda";
import { normalizarTexto } from "@/shared/lib/texto";
import {
  CATEGORIAS,
  type CambioPrecio,
  type CategoriaProducto,
  type Producto,
  type RedondeoPrecio,
} from "@/shared/types/producto";
import { Boton } from "@/shared/ui/Boton";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import { useToast } from "@/shared/ui/use-toast";

const REDONDEOS: Array<{ valor: RedondeoPrecio; etiqueta: string }> = [
  { valor: "NINGUNO", etiqueta: "Sin redondeo" },
  { valor: "DIEZ", etiqueta: "A $10 hacia arriba" },
  { valor: "CINCUENTA", etiqueta: "A $50 hacia arriba" },
];

export function ActualizacionMasiva({
  productos,
  onAplicado,
}: {
  productos: readonly Producto[];
  onAplicado: (cambios: CambioPrecio[]) => void;
}): ReactElement {
  const [categoria, setCategoria] = useState<CategoriaProducto | null>(null);
  const [marca, setMarca] = useState<string | null>(null);
  const [porcentajeTexto, setPorcentajeTexto] = useState("");
  const [redondeo, setRedondeo] = useState<RedondeoPrecio>("NINGUNO");
  const [vistaPrevia, setVistaPrevia] = useState<CambioPrecio[] | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const { mostrar } = useToast();

  const marcas = useMemo(() => {
    const porClave = new Map<string, string>();
    for (const producto of productos) {
      if (!producto.activo || !producto.marca) continue;
      if (categoria && producto.categoria !== categoria) continue;
      porClave.set(normalizarTexto(producto.marca), producto.marca);
    }
    return [...porClave.values()].sort((a, b) => a.localeCompare(b, "es-AR"));
  }, [productos, categoria]);

  const datos = {
    categoria,
    marca,
    porcentaje: Number(porcentajeTexto.replace(",", ".")),
    redondeo,
  };
  const cambiarFiltro = () => setVistaPrevia(null);

  const generarVistaPrevia = () => {
    const validado = validarActualizacionMasiva(datos);
    if (!validado.ok) {
      mostrar(validado.error, "error");
      return;
    }
    const cambios = previsualizarPrecios(
      productos,
      validado.data.filtro,
      validado.data.porcentaje,
      validado.data.redondeo,
    );
    if (cambios.length === 0) mostrar("No hay productos activos con ese filtro.", "error");
    setVistaPrevia(cambios);
  };

  const aplicar = async () => {
    if (!vistaPrevia?.length) return;
    setAplicando(true);
    try {
      const resultado = await actualizarPreciosMasivo(
        datos,
        vistaPrevia.map(({ id, precioActual }) => ({ id, precioActual })),
      );
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }
      mostrar(`Se actualizaron ${resultado.data.actualizados} precios.`);
      onAplicado(vistaPrevia);
      setVistaPrevia(null);
      setConfirmando(false);
      setPorcentajeTexto("");
    } catch (error) {
      console.error("products.actualizarPreciosMasivo", error);
      mostrar("No se pudieron actualizar los precios. Revisá la conexión.", "error");
    } finally {
      setAplicando(false);
    }
  };

  return (
    <section className="actualizacion-masiva" aria-labelledby="titulo-actualizacion-masiva">
      <h2 id="titulo-actualizacion-masiva">Actualizar precios</h2>
      <div className="actualizacion-masiva__campos">
        <label className="campo-formulario">
          Categoría
          <select
            className="entrada-formulario"
            value={categoria ?? ""}
            onChange={(evento) => {
              setCategoria((evento.target.value || null) as CategoriaProducto | null);
              setMarca(null);
              cambiarFiltro();
            }}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="campo-formulario">
          Marca (opcional)
          <select
            className="entrada-formulario"
            value={marca ?? ""}
            onChange={(evento) => {
              setMarca(evento.target.value || null);
              cambiarFiltro();
            }}
          >
            <option value="">Todas</option>
            {marcas.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </label>
        <label className="campo-formulario">
          Porcentaje
          <input
            className="entrada-formulario"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={PORCENTAJE_MINIMO}
            max={PORCENTAJE_MAXIMO}
            value={porcentajeTexto}
            onChange={(evento) => {
              setPorcentajeTexto(evento.target.value);
              cambiarFiltro();
            }}
            placeholder="Ej: 8 o -5"
          />
        </label>
      </div>
      <fieldset className="opciones-redondeo">
        <legend>Redondeo</legend>
        {REDONDEOS.map((opcion) => (
          <label key={opcion.valor}>
            <input
              type="radio"
              name="redondeo-precio"
              checked={redondeo === opcion.valor}
              onChange={() => {
                setRedondeo(opcion.valor);
                cambiarFiltro();
              }}
            />
            {opcion.etiqueta}
          </label>
        ))}
      </fieldset>
      <Boton variant="secundario" onClick={generarVistaPrevia} disabled={!porcentajeTexto}>
        Ver vista previa
      </Boton>

      {vistaPrevia && vistaPrevia.length > 0 ? (
        <div className="vista-previa-precios">
          <p>
            {vistaPrevia.length} {vistaPrevia.length === 1 ? "producto" : "productos"}. Las ventas
            ya registradas no cambian.
          </p>
          <ul>
            {vistaPrevia.map((cambio) => (
              <li key={cambio.id}>
                <span>
                  {cambio.nombre}
                  {cambio.marca ? <small> · {cambio.marca}</small> : null}
                </span>
                <span className="vista-previa-precios__precios">
                  <s>{formatearPesos(cambio.precioActual)}</s> →{" "}
                  <strong>{formatearPesos(cambio.precioNuevo)}</strong>
                </span>
              </li>
            ))}
          </ul>
          <Boton onClick={() => setConfirmando(true)}>
            Aplicar a {vistaPrevia.length} {vistaPrevia.length === 1 ? "producto" : "productos"}
          </Boton>
        </div>
      ) : null}

      <ConfirmarAccion
        abierto={confirmando}
        titulo="Actualizar precios"
        mensaje={`Se cambiará el precio de ${vistaPrevia?.length ?? 0} productos. Las ventas pasadas conservan su precio.`}
        textoConfirmar="Aplicar"
        variantConfirmar="primario"
        confirmando={aplicando}
        alConfirmar={() => void aplicar()}
        alCancelar={() => setConfirmando(false)}
      />
    </section>
  );
}
