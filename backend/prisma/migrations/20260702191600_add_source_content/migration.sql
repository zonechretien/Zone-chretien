-- CreateEnum
CREATE TYPE "SourceStatut" AS ENUM ('NOUVEAU', 'PUBLIE', 'IGNORE');

-- CreateTable
CREATE TABLE "source_contents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plateforme" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "artiste" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "extrait" TEXT,
    "statut" "SourceStatut" NOT NULL DEFAULT 'NOUVEAU',
    "metadata" TEXT,
    "publishedType" TEXT,
    "publishedId" TEXT,
    "decouvertAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteAt" TIMESTAMP(3),

    CONSTRAINT "source_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_contents_url_key" ON "source_contents"("url");

-- CreateIndex
CREATE INDEX "source_contents_statut_idx" ON "source_contents"("statut");

-- CreateIndex
CREATE INDEX "source_contents_plateforme_idx" ON "source_contents"("plateforme");
