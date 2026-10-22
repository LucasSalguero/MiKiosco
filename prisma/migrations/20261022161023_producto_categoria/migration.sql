-- Categoría, marca y código de barras de los productos. Solo agrega columnas:
-- los productos existentes quedan en VARIOS por el valor por defecto, sin UPDATE.
-- El índice único admite varios NULL (productos sin código de barras).

-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('BEBIDAS', 'GOLOSINAS', 'CIGARRILLOS', 'ALMACEN', 'LACTEOS', 'PANIFICADOS', 'LIMPIEZA', 'SERVICIOS', 'VARIOS');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "categoria" "CategoriaProducto" NOT NULL DEFAULT 'VARIOS',
ADD COLUMN     "codigoBarras" VARCHAR(32),
ADD COLUMN     "marca" VARCHAR(80);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarras_key" ON "Producto"("codigoBarras");

