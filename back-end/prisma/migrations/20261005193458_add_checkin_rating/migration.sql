-- AlterTable: add rating column with a default for existing rows, then drop the default
ALTER TABLE "CheckIn" ADD COLUMN "rating" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "CheckIn" ALTER COLUMN "rating" DROP DEFAULT;
