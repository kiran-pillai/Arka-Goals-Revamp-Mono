-- Legacy timing remains unknown: no speculative backfill or removal of rows.
ALTER TABLE "CheckIn" ADD COLUMN "reportingWeekStart" DATE,
  ADD COLUMN "dueAt" TIMESTAMPTZ(3);
CREATE UNIQUE INDEX "CheckIn_userId_reportingWeekStart_key" ON "CheckIn"("userId", "reportingWeekStart");
CREATE TABLE "Kudos" (
  "id" TEXT NOT NULL,
  "giverId" TEXT NOT NULL,
  "checkInId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Kudos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Kudos_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Kudos_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Kudos_giverId_checkInId_key" ON "Kudos"("giverId", "checkInId");
CREATE INDEX "Kudos_checkInId_createdAt_id_idx" ON "Kudos"("checkInId", "createdAt", "id");
