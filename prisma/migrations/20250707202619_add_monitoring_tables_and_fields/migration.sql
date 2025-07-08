-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_activity_at" DATETIME;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "details" JSONB,
    "originIp" TEXT,
    "durationMs" INTEGER,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
