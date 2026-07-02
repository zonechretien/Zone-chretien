-- CreateTable
CREATE TABLE "media_galeries" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publicationId" TEXT,
    "evenementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_galeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_galeries_publicationId_idx" ON "media_galeries"("publicationId");

-- CreateIndex
CREATE INDEX "media_galeries_evenementId_idx" ON "media_galeries"("evenementId");

-- AddForeignKey
ALTER TABLE "media_galeries" ADD CONSTRAINT "media_galeries_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_galeries" ADD CONSTRAINT "media_galeries_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "evenements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
