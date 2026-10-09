-- A goal is now created as exactly one of habit/process based or outcome based.
--
-- Carrying existing rows over: every Goal that exists today is an outcome goal.
-- Neither ACTION_BASED nor PASS_FAIL carries any notion of a repeating
-- frequency, so no existing row could become HABIT_PROCESS without inventing
-- frequency data it never had. Both values therefore map to OUTCOME.
--
-- This is lossless rather than a reinterpretation: the old ACTION_BASED vs
-- PASS_FAIL distinction is still readable off `targetValue`, which is left
-- untouched. ACTION_BASED rows keep their target number and PASS_FAIL rows keep
-- NULL, and that is exactly how the new shape tells a quantified outcome from a
-- pass/fail one.

-- CreateEnum
CREATE TYPE "FrequencyPeriod" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER');

-- AlterEnum
-- The mapping is spelled out per old value rather than defaulted, so an
-- unexpected value would fail this migration loudly against the NOT NULL column
-- instead of being silently folded into OUTCOME.
CREATE TYPE "MeasureType_new" AS ENUM ('HABIT_PROCESS', 'OUTCOME');
ALTER TABLE "Goal" ALTER COLUMN "measureType" TYPE "MeasureType_new" USING (
  CASE "measureType"::text
    WHEN 'ACTION_BASED' THEN 'OUTCOME'
    WHEN 'PASS_FAIL' THEN 'OUTCOME'
  END
)::"MeasureType_new";
ALTER TYPE "MeasureType" RENAME TO "MeasureType_old";
ALTER TYPE "MeasureType_new" RENAME TO "MeasureType";
DROP TYPE "public"."MeasureType_old";

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "frequencyCount" INTEGER,
ADD COLUMN     "frequencyPeriod" "FrequencyPeriod";

-- Enforce the two shapes in the database as well as in the service: a
-- habit/process goal carries both halves of its frequency and no target value,
-- an outcome goal carries no frequency. Every migrated row satisfies the
-- OUTCOME branch, since the frequency columns were just added as NULL.
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_measure_shape_check" CHECK (
  (
    "measureType" = 'HABIT_PROCESS'
    AND "frequencyCount" IS NOT NULL
    AND "frequencyCount" >= 1
    AND "frequencyPeriod" IS NOT NULL
    AND "targetValue" IS NULL
  )
  OR (
    "measureType" = 'OUTCOME'
    AND "frequencyCount" IS NULL
    AND "frequencyPeriod" IS NULL
  )
);
