-- Keep canceled sales available to the history while excluding them from totals.
ALTER TABLE "Venta" ADD COLUMN "anulada" BOOLEAN NOT NULL DEFAULT false;