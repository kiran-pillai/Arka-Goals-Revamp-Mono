ALTER TABLE "Notification" ALTER COLUMN "commentId" DROP NOT NULL;
ALTER TABLE "Notification" ADD COLUMN "kudosId" TEXT;
CREATE UNIQUE INDEX "Notification_kudosId_key" ON "Notification"("kudosId");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_kudosId_fkey"
  FOREIGN KEY ("kudosId") REFERENCES "Kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_exactly_one_source"
  CHECK (("commentId" IS NOT NULL)::int + ("kudosId" IS NOT NULL)::int = 1);
