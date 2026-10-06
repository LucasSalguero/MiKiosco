import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { TotalDiaProvider } from "@/features/daily-summary/ui/TotalDiaProvider";
import { InicioPuntoVenta } from "@/features/sales/ui/InicioPuntoVenta";
import { consolidarVencidasDelDia } from "@/features/fiados/actions/consolidar-vencidas-del-dia";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const consolidacion = await consolidarVencidasDelDia();
  if (!consolidacion.ok) throw new Error(consolidacion.error);
  const resultado = await obtenerResumenDiario();

  return (
    <TotalDiaProvider
      totalInicial={resultado.ok ? resultado.data.cobrado : 0}
      clavesOperacionInicial={resultado.ok ? resultado.data.clavesOperacion : []}
      cantidadACobrarHoyInicial={resultado.ok ? resultado.data.cantidadACobrarHoy : 0}
      errorInicial={resultado.ok ? undefined : resultado.error}
    >
      <InicioPuntoVenta />
    </TotalDiaProvider>
  );
}
