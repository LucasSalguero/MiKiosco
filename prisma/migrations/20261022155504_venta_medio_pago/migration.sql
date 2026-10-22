-- Medio de pago de las ventas cobradas en el momento.
ALTER TABLE "Venta" ADD COLUMN "medioPago" "MedioPago";

-- Único cambio de datos autorizado: las ventas pagadas existentes no tienen
-- medio registrado, así que quedan como DESCONOCIDO. Las demás quedan en NULL.
UPDATE "Venta" SET "medioPago" = 'DESCONOCIDO' WHERE "estadoPago" = 'PAGADA';

-- Una venta pagada siempre tiene medio; una fiada o a cobrar hoy nunca lo tiene
-- (su medio se registra en el Pago correspondiente).
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_medio_pago_check"
    CHECK (("estadoPago" = 'PAGADA') = ("medioPago" IS NOT NULL));
