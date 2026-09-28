-- Add a stable client-generated key so retried sales are idempotent.
ALTER TABLE "Venta" ADD COLUMN "clienteId" TEXT;

CREATE UNIQUE INDEX "Venta_clienteId_key" ON "Venta"("clienteId");