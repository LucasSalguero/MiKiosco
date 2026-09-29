import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { listarVentasPorDia } from "@/features/sales-history/actions/listar-ventas-por-dia";
import { ListaVentas } from "@/features/sales-history/ui/ListaVentas";
import { SelectorDia } from "@/features/sales-history/ui/SelectorDia";
import { TotalDelDia } from "@/features/daily-summary/ui/TotalDelDia";
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
    return (
      <main className="historial">
        <section className="mensaje-error" role="alert">{resultadoResumen.error}</section>
      </main>
    );
  }
  if (!resultadoVentas.ok) {
    return (
      <main className="historial">
        <section className="mensaje-error" role="alert">{resultadoVentas.error}</section>
      </main>
    );
  }

  return (
    <main className="historial">
      <header className="historial__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Historial</h1>
        </div>
        <TotalDelDia total={resultadoResumen.data.total} />
      </header>
      <section className="historial__contenido" aria-label="Ventas del día">
        <SelectorDia fecha={fecha} />
        <ListaVentas ventas={resultadoVentas.data} />
      </section>
    </main>
  );
}