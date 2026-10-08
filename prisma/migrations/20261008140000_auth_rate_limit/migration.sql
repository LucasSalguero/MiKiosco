CREATE TABLE "AuthRateLimit" (
    "origen" VARCHAR(64) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ventanaInicia" TIMESTAMP(3) NOT NULL,
    "bloqueadoHasta" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("origen")
);

CREATE INDEX "AuthRateLimit_expiraEn_idx" ON "AuthRateLimit"("expiraEn");
