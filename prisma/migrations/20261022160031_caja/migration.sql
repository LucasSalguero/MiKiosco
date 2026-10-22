-- Cierre de caja: movimientos de efectivo y foto inmutable del arqueo diario.
-- Solo agrega estructuras; no modifica datos existentes.
-- registradaEn: momento en que la venta llegó al servidor (puede ser posterior a
-- su fecha si se vendió sin conexión). Las filas existentes toman la fecha de esta
-- migración, lo que es inocuo porque todavía no hay cierres.

-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('EGRESO', 'RETIRO', 'INGRESO');

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "registradaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "motivo" VARCHAR(160) NOT NULL,
    "claveOperacion" TEXT NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreCaja" (
    "id" SERIAL NOT NULL,
    "fecha" VARCHAR(10) NOT NULL,
    "fondoInicial" DECIMAL(12,2) NOT NULL,
    "efectivoEsperado" DECIMAL(12,2) NOT NULL,
    "efectivoContado" DECIMAL(12,2) NOT NULL,
    "diferencia" DECIMAL(12,2) NOT NULL,
    "totalVendido" DECIMAL(12,2) NOT NULL,
    "totalCobrado" DECIMAL(12,2) NOT NULL,
    "totalEfectivo" DECIMAL(12,2) NOT NULL,
    "totalTransfer" DECIMAL(12,2) NOT NULL,
    "totalDesconocido" DECIMAL(12,2) NOT NULL,
    "fiadoNuevo" DECIMAL(12,2) NOT NULL,
    "totalEgresos" DECIMAL(12,2) NOT NULL,
    "totalRetiros" DECIMAL(12,2) NOT NULL,
    "totalIngresos" DECIMAL(12,2) NOT NULL,
    "cantidadVentas" INTEGER NOT NULL,
    "observaciones" VARCHAR(500),
    "cerradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCaja_claveOperacion_key" ON "MovimientoCaja"("claveOperacion");

-- CreateIndex
CREATE INDEX "MovimientoCaja_fecha_idx" ON "MovimientoCaja"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "CierreCaja_fecha_key" ON "CierreCaja"("fecha");

ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_monto_positivo_check" CHECK ("monto" > 0);
