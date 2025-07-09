-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments_360" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importBatchId" TEXT,
    CONSTRAINT "assessments_360_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_assessments_360" ("authorId", "createdAt", "cycle", "evaluatedUserId", "id", "improvements", "isImported", "overallScore", "status", "strengths", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "evaluatedUserId", "id", "improvements", "isImported", "overallScore", "status", "strengths", "submittedAt", "updatedAt" FROM "assessments_360";
DROP TABLE "assessments_360";
ALTER TABLE "new_assessments_360" RENAME TO "assessments_360";
CREATE UNIQUE INDEX "assessments_360_authorId_evaluatedUserId_cycle_key" ON "assessments_360"("authorId", "evaluatedUserId", "cycle");
CREATE TABLE "new_reference_feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "referencedUserId" TEXT NOT NULL,
    "topic" TEXT,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importBatchId" TEXT,
    CONSTRAINT "reference_feedbacks_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_referencedUserId_fkey" FOREIGN KEY ("referencedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reference_feedbacks" ("authorId", "createdAt", "cycle", "id", "isImported", "justification", "referencedUserId", "status", "submittedAt", "topic", "updatedAt") SELECT "authorId", "createdAt", "cycle", "id", "isImported", "justification", "referencedUserId", "status", "submittedAt", "topic", "updatedAt" FROM "reference_feedbacks";
DROP TABLE "reference_feedbacks";
ALTER TABLE "new_reference_feedbacks" RENAME TO "reference_feedbacks";
CREATE UNIQUE INDEX "reference_feedbacks_authorId_referencedUserId_cycle_key" ON "reference_feedbacks"("authorId", "referencedUserId", "cycle");
CREATE TABLE "new_self_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importBatchId" TEXT,
    CONSTRAINT "self_assessments_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "self_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_self_assessments" ("authorId", "createdAt", "cycle", "id", "isImported", "status", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "id", "isImported", "status", "submittedAt", "updatedAt" FROM "self_assessments";
DROP TABLE "self_assessments";
ALTER TABLE "new_self_assessments" RENAME TO "self_assessments";
CREATE UNIQUE INDEX "self_assessments_authorId_cycle_key" ON "self_assessments"("authorId", "cycle");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "jobTitle" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "careerTrack" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "projects" TEXT,
    "managerId" TEXT,
    "directReports" TEXT,
    "mentorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "importBatchId" TEXT,
    CONSTRAINT "users_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("businessUnit", "careerTrack", "createdAt", "directReports", "email", "id", "isActive", "isImported", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt") SELECT "businessUnit", "careerTrack", "createdAt", "directReports", "email", "id", "isActive", "isImported", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
