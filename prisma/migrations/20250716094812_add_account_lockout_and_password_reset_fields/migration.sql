-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "last_activity_at" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockUntil" DATETIME,
    "passwordResetCode" TEXT,
    "passwordResetCodeExpiresAt" DATETIME,
    "jobTitle" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "careerTrack" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "businessHub" TEXT,
    "projects" TEXT,
    "managerId" TEXT,
    "directReports" TEXT,
    "mentorId" TEXT,
    "leaderId" TEXT,
    "directLeadership" TEXT,
    "mentoringIds" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "importBatchId" TEXT,
    CONSTRAINT "users_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("businessHub", "businessUnit", "careerTrack", "createdAt", "directLeadership", "directReports", "email", "id", "importBatchId", "isActive", "jobTitle", "last_activity_at", "leaderId", "managerId", "mentorId", "mentoringIds", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt") SELECT "businessHub", "businessUnit", "careerTrack", "createdAt", "directLeadership", "directReports", "email", "id", "importBatchId", "isActive", "jobTitle", "last_activity_at", "leaderId", "managerId", "mentorId", "mentoringIds", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
