-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('CREOLE', 'FRANCAIS', 'ANGLAIS', 'ESPAGNOL', 'AUTRE');

-- AlterTable
ALTER TABLE "musiques" ADD COLUMN     "langue" "Langue" NOT NULL DEFAULT 'AUTRE';

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "langue" "Langue" NOT NULL DEFAULT 'AUTRE';

-- CreateIndex
CREATE INDEX "musiques_langue_idx" ON "musiques"("langue");

-- CreateIndex
CREATE INDEX "videos_langue_idx" ON "videos"("langue");
