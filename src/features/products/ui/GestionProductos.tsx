"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { actualizarProducto } from "@/features/products/actions/actualizar-producto";
import { crearProducto } from "@/features/products/actions/crear-producto";
import { desactivarProducto } from "@/features/products/actions/desactivar-producto";
import { reactivarProducto } from "@/features/products/actions/reactivar-producto";
import { FormularioProducto } from "@/features/products/ui/FormularioProducto";
import { ListaProductos } from "@/features/products/ui/ListaProductos";
import { useToast } from "@/shared/ui/use-toast";
import type { DatosProducto, Producto } from "@/shared/types/producto";

export function GestionProductos({ productosIniciales }: { productosIniciales: Producto[] }): ReactElement {
  const [productos, setProductos] = useState(productosIniciales);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const router = useRouter();
  const { mostrar } = useToast();
  const activos = productos.filter((producto) => producto.activo);
  const inactivos = productos.filter((producto) => !producto.activo);

  const guardar = async (datos: DatosProducto): Promise<string | null> => {
    const resultado = productoEditando
      ? await actualizarProducto(productoEditando.id, datos)
      : await crearProducto(datos);

    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return resultado.error;
    }

    setProductos((actuales) => {
      const sinProductoEditado = actuales.filter((producto) => producto.id !== resultado.data.id);
      return [...sinProductoEditado, resultado.data].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setProductoEditando(null);
    mostrar(productoEditando ? "Producto actualizado." : "Producto creado.");
    router.refresh();
    return null;
  };

  const desactivar = async (id: number) => {
    const resultado = await desactivarProducto(id);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    setProductos((actuales) =>
      actuales.map((producto) => (producto.id === id ? { ...producto, activo: false } : producto)),
    );
    if (productoEditando?.id === id) setProductoEditando(null);
    mostrar("Producto desactivado.");
    router.refresh();
  };

  const reactivar = async (id: number) => {
    const resultado = await reactivarProducto(id);
    if (!resultado.ok) {
      mostrar(resultado.error, "error");
      return;
    }
    setProductos((actuales) =>
      actuales.map((producto) => (producto.id === id ? { ...producto, activo: true } : producto)),
    );
    mostrar("Producto reactivado.");
    router.refresh();
  };

  return (
    <main className="gestion-productos">
      <header className="gestion-productos__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Productos</h1>
        </div>
      </header>

      <section className="gestion-productos__formulario" aria-labelledby="titulo-formulario-producto">
        <h2 id="titulo-formulario-producto">
          {productoEditando ? `Editar ${productoEditando.nombre}` : "Nuevo producto"}
        </h2>
        <FormularioProducto
          key={productoEditando?.id ?? "nuevo"}
          producto={productoEditando ?? undefined}
          onGuardar={guardar}
          onCancelar={productoEditando ? () => setProductoEditando(null) : undefined}
        />
      </section>

      <section className="gestion-productos__listado" aria-labelledby="titulo-productos-activos">
        <div className="gestion-productos__titulo-lista">
          <h2 id="titulo-productos-activos">Activos</h2>
          <span>{activos.length}</span>
        </div>
        {activos.length ? (
          <ListaProductos
            productos={activos}
            onSeleccionar={setProductoEditando}
            onDesactivar={desactivar}
          />
        ) : (
          <p className="estado-vacio">
            {productos.length ? "No hay productos activos." : "Todavía no hay productos. Cargá tu primer producto arriba."}
          </p>
        )}
      </section>

      <details className="productos-inactivos">
        <summary>Inactivos ({inactivos.length})</summary>
        {inactivos.length ? (
          <ListaProductos
            productos={inactivos}
            onSeleccionar={setProductoEditando}
            onReactivar={reactivar}
          />
        ) : (
          <p className="estado-vacio">No hay productos inactivos.</p>
        )}
      </details>
    </main>
  );
}