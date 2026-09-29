import { listarProductosGestion } from "@/features/products/actions/listar-productos";
import { GestionProductos } from "@/features/products/ui/GestionProductos";

export default async function ProductosPage() {
  const resultado = await listarProductosGestion();

  if (!resultado.ok) {
    throw new Error(resultado.error);
  }

  return <GestionProductos productosIniciales={resultado.data} />;
}