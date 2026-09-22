import { listarProductosActivos } from "@/features/products/actions/listar-productos";
import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { CabeceraPuntoVenta } from "@/features/daily-summary/ui/CabeceraPuntoVenta";
import { VentaRapida } from "@/features/sales/ui/VentaRapida";

export default async function HomePage() {
  const resultado = await listarProductosActivos();
  const resumen = await obtenerResumenDiario();

  return (
    <main className="punto-venta">
      <CabeceraPuntoVenta resumenInicial={resumen.ok ? resumen.data : null} />

      {resultado.ok ? (
        <VentaRapida productos={resultado.data} />
      ) : (
        <section className="mensaje-error" role="alert">
          {resultado.error}
        </section>
      )}
    </main>
  );
}
