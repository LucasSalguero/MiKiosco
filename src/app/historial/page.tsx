import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { listarVentasPorDia } from "@/features/sales-history/actions/listar-ventas-por-dia";
import { ListaVentas } from "@/features/sales-history/ui/ListaVentas";
import { SelectorDia } from "@/features/sales-history/ui/SelectorDia";
import { PendientesDelDia } from "@/features/sales-history/ui/PendientesDelDia";
import { esFechaISOValida, hoyISO } from "@/shared/lib/fechas";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string | string[] }>;
}) {
  const parametros = await searchParams;
  const fechaParametro = Array.isArray(parametros.fecha) ? parametros.fecha[0] : parametros.fecha;
  const hoy = hoyISO();
  const fecha =
    fechaParametro && esFechaISOValida(fechaParametro) && fechaParametro <= hoy
      ? fechaParametro
      : hoy;
  const [resultadoResumen, resultadoVentas] = await Promise.all([
    obtenerResumenDiario(fecha),
    listarVentasPorDia(fecha),
  ]);

  if (!resultadoResumen.ok) {
    throw new Error(resultadoResumen.error);
  }
  if (!resultadoVentas.ok) {
    throw new Error(resultadoVentas.error);
  }

  return (
    <main className="historial">
      <header className="historial__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Historial</h1>
        </div>
      </header>
      <section className="historial__contenido" aria-label="Ventas del día">
        <SelectorDia fecha={fecha} />
        <PendientesDelDia
          fecha={fecha}
          totalServidor={resultadoResumen.data.total}
          clienteIds={resultadoResumen.data.clienteIds ?? []}
        />
        <ListaVentas ventas={resultadoVentas.data} />
      </section>
    </main>
  );
}
