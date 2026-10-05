CREATE TYPE "TipoPago" AS ENUM ('CONTADO', 'FIADO');

ALTER TABLE "Venta"
ADD COLUMN "tipoPago" "TipoPago" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN "clienteNombre" TEXT;

ALTER TABLE "VentaItem"
ADD COLUMN "productoNombre" TEXT;

UPDATE "VentaItem" AS item
SET "productoNombre" = producto."nombre"
FROM "Producto" AS producto
WHERE item."productoId" = producto."id";

ALTER TABLE "VentaItem"
ALTER COLUMN "productoId" DROP NOT NULL,
ALTER COLUMN "productoNombre" SET NOT NULL;

CREATE TABLE "CobroFiado" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CobroFiado_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CobroFiado_fecha_idx" ON "CobroFiado"("fecha");
CREATE INDEX "CobroFiado_ventaId_idx" ON "CobroFiado"("ventaId");

ALTER TABLE "CobroFiado"
ADD CONSTRAINT "CobroFiado_ventaId_fkey"
FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
