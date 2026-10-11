CREATE TABLE "Notification" (
 "id" TEXT NOT NULL, "recipientId" TEXT NOT NULL, "commentId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "readAt" TIMESTAMP(3),
 CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Notification_commentId_key" ON "Notification"("commentId");
CREATE INDEX "Notification_recipientId_createdAt_id_idx" ON "Notification"("recipientId", "createdAt", "id");
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");
