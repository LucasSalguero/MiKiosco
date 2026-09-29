import { listarProductosGestion } from "@/features/products/actions/listar-productos";
import { GestionProductos } from "@/features/products/ui/GestionProductos";

export default async function ProductosPage() {
  const resultado = await listarProductosGestion();

  if (!resultado.ok) {
    return (
      <main className="gestion-productos">
        <section className="mensaje-error" role="alert">
          {resultado.error}
        </section>
      </main>
    );
  }

  return <GestionProductos productosIniciales={resultado.data} />;
}