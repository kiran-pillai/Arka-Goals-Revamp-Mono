/*
  Warnings:

  - The values [MONTHLY] on the enum `GoalPeriodChoice` will be removed. If these variants are still used in the database, this will fail.
  - The values [MONTHLY,GIVE_UP] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GoalPeriodChoice_new" AS ENUM ('QUARTERLY');
ALTER TABLE "Goal" ALTER COLUMN "periodChoice" TYPE "GoalPeriodChoice_new" USING ("periodChoice"::text::"GoalPeriodChoice_new");
ALTER TYPE "GoalPeriodChoice" RENAME TO "GoalPeriodChoice_old";
ALTER TYPE "GoalPeriodChoice_new" RENAME TO "GoalPeriodChoice";
DROP TYPE "public"."GoalPeriodChoice_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GoalType_new" AS ENUM ('WEEKLY', 'QUARTERLY');
ALTER TABLE "Goal" ALTER COLUMN "type" TYPE "GoalType_new" USING ("type"::text::"GoalType_new");
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
ALTER TYPE "GoalType_new" RENAME TO "GoalType";
DROP TYPE "public"."GoalType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
