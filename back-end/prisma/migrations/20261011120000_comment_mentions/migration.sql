DROP INDEX "Notification_commentId_key";
ALTER TABLE "Notification" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'COMMENT';
CREATE UNIQUE INDEX "Notification_recipientId_commentId_key" ON "Notification"("recipientId", "commentId");
