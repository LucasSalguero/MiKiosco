CREATE TYPE "EstadoPago" AS ENUM ('PAGADA', 'A_COBRAR_HOY', 'FIADA');
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'DESCONOCIDO');

ALTER TABLE "Venta" RENAME COLUMN "clienteId" TO "claveOperacion";
ALTER INDEX "Venta_clienteId_key" RENAME TO "Venta_claveOperacion_key";

CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cliente_nombreNormalizado_key" ON "Cliente"("nombreNormalizado");

WITH nombres AS (
    SELECT
        translate(lower(btrim("clienteNombre")), 'ÁÉÍÓÚÜÑáéíóúüñ', 'aeiouunaeiouun') AS normalizado,
        min(btrim("clienteNombre")) AS nombre
    FROM "Venta"
    WHERE "tipoPago" = 'FIADO' AND nullif(btrim("clienteNombre"), '') IS NOT NULL
    GROUP BY translate(lower(btrim("clienteNombre")), 'ÁÉÍÓÚÜÑáéíóúüñ', 'aeiouunaeiouun')
)
INSERT INTO "Cliente" ("nombre", "nombreNormalizado")
SELECT nombre, normalizado FROM nombres;

ALTER TABLE "Venta"
    ADD COLUMN "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PAGADA',
    ADD COLUMN "clienteFiadoId" INTEGER,
    ADD COLUMN "autorizadaPor" VARCHAR(120);

UPDATE "Venta"
SET
    "estadoPago" = CASE WHEN "tipoPago" = 'FIADO' THEN 'FIADA'::"EstadoPago" ELSE 'PAGADA'::"EstadoPago" END,
    "clienteFiadoId" = "Cliente"."id"
FROM "Cliente"
WHERE "tipoPago" = 'FIADO'
  AND translate(lower(btrim("Venta"."clienteNombre")), 'ÁÉÍÓÚÜÑáéíóúüñ', 'aeiouunaeiouun') = "Cliente"."nombreNormalizado";

CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");
CREATE INDEX "Venta_clienteFiadoId_estadoPago_idx" ON "Venta"("clienteFiadoId", "estadoPago");

ALTER TABLE "Venta"
    ADD CONSTRAINT "Venta_clienteFiadoId_fkey"
    FOREIGN KEY ("clienteFiadoId") REFERENCES "Cliente"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "Venta_fiado_cliente_check"
    CHECK ("estadoPago" = 'PAGADA' OR "clienteFiadoId" IS NOT NULL);

CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "clienteFiadoId" INTEGER NOT NULL,
    "ventaId" INTEGER,
    "monto" DECIMAL(12,2) NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claveOperacion" TEXT NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Pago" ("clienteFiadoId", "ventaId", "monto", "medio", "fecha", "claveOperacion")
SELECT venta."clienteFiadoId", cobro."ventaId", cobro."monto"::DECIMAL(12,2), 'DESCONOCIDO', cobro."fecha",
       'migracion-cobro-' || cobro."id"::TEXT
FROM "CobroFiado" AS cobro
JOIN "Venta" AS venta ON venta."id" = cobro."ventaId"
WHERE venta."clienteFiadoId" IS NOT NULL;

CREATE UNIQUE INDEX "Pago_claveOperacion_key" ON "Pago"("claveOperacion");
CREATE INDEX "Pago_fecha_idx" ON "Pago"("fecha");
CREATE INDEX "Pago_clienteFiadoId_anulado_idx" ON "Pago"("clienteFiadoId", "anulado");
CREATE INDEX "Pago_ventaId_idx" ON "Pago"("ventaId");

ALTER TABLE "Pago"
    ADD CONSTRAINT "Pago_clienteFiadoId_fkey"
    FOREIGN KEY ("clienteFiadoId") REFERENCES "Cliente"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "Pago_ventaId_fkey"
    FOREIGN KEY ("ventaId") REFERENCES "Venta"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Producto" ALTER COLUMN "precio" TYPE DECIMAL(12,2) USING round("precio", 2);
ALTER TABLE "Venta" ALTER COLUMN "total" TYPE DECIMAL(12,2) USING round("total", 2);
ALTER TABLE "VentaItem" ALTER COLUMN "precioUnitario" TYPE DECIMAL(12,2) USING round("precioUnitario", 2);

DROP TABLE "CobroFiado";
ALTER TABLE "Venta" DROP COLUMN "tipoPago";
DROP TYPE "TipoPago";
