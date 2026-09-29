import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { TotalDiaProvider } from "@/features/daily-summary/ui/TotalDiaProvider";
import { InicioPuntoVenta } from "@/features/sales/ui/InicioPuntoVenta";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const resultado = await obtenerResumenDiario();

  return (
    <TotalDiaProvider
      totalInicial={resultado.ok ? resultado.data.total : 0}
      errorInicial={resultado.ok ? undefined : resultado.error}
    >
      <InicioPuntoVenta />
    </TotalDiaProvider>
  );
}
