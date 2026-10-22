import { obtenerArqueoDelDia } from "@/features/cash-register/actions/obtener-arqueo-del-dia";
import { ArqueoCaja } from "@/features/cash-register/ui/ArqueoCaja";
import { CierreGuardado } from "@/features/cash-register/ui/CierreGuardado";
import { MovimientosCaja } from "@/features/cash-register/ui/MovimientosCaja";
import { TarjetasCaja } from "@/features/cash-register/ui/TarjetasCaja";
import { TopProductos } from "@/features/cash-register/ui/TopProductos";
import { VentasPorHora } from "@/features/cash-register/ui/VentasPorHora";
import { SelectorDia } from "@/features/sales-history/ui/SelectorDia";
import { esFechaISOValida, hoyISO } from "@/shared/lib/fechas";

export const dynamic = "force-dynamic";

export default async function CajaPage({
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

  const resultado = await obtenerArqueoDelDia(fecha);
  if (!resultado.ok) throw new Error(resultado.error);
  const dia = resultado.data;

  const tarjetas = dia.cerrado
    ? {
        cobrado: dia.cierre.totalCobrado,
        efectivo: dia.cierre.totalEfectivo,
        transferencia: dia.cierre.totalTransfer,
        desconocido: dia.cierre.totalDesconocido,
        fiadoNuevo: dia.cierre.fiadoNuevo,
        cantidadVentas: dia.cierre.cantidadVentas,
        ticketPromedio: dia.cierre.cantidadVentas
          ? Math.round((dia.cierre.totalVendido * 100) / dia.cierre.cantidadVentas) / 100
          : 0,
      }
    : {
        cobrado: dia.arqueo.cobrado,
        efectivo: dia.arqueo.cobradoEfectivo,
        transferencia: dia.arqueo.cobradoTransferencia,
        desconocido: dia.arqueo.cobradoDesconocido,
        fiadoNuevo: dia.arqueo.fiadoNuevo,
        cantidadVentas: dia.arqueo.cantidadVentas,
        ticketPromedio: dia.arqueo.ticketPromedio,
      };

  return (
    <main className="historial caja">
      <header className="historial__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Caja</h1>
          <p className="historial__descripcion">
            {dia.cerrado ? "Caja cerrada. Se muestra la foto guardada." : "Arqueo del día."}
          </p>
        </div>
      </header>
      <section className="historial__contenido" aria-label="Caja del día">
        <SelectorDia fecha={fecha} etiqueta="Elegir fecha de la caja" />
        <TarjetasCaja {...tarjetas} />
        <MovimientosCaja
          movimientos={dia.movimientos}
          puedeRegistrar={!dia.cerrado && fecha === hoy}
          puedeAnular={!dia.cerrado}
        />
        <TopProductos productos={dia.topProductos} />
        <VentasPorHora franjas={dia.ventasPorHora} />
        {dia.cerrado ? (
          <CierreGuardado cierre={dia.cierre} posteriores={dia.posteriores} />
        ) : (
          <ArqueoCaja
            key={fecha}
            fecha={fecha}
            arqueo={dia.arqueo}
            fondoSugerido={dia.fondoSugerido}
          />
        )}
      </section>
    </main>
  );
}
