/*
  Warnings:

  - You are about to drop the `auto_avaliacoes_importadas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `avaliacoes_360_importadas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `import_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `perfis_importados` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pesquisas_referencia_importadas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isImported` on the `assessments_360` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `committee_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `evaluation_cycles` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `manager_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `mentoring_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `reference_feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `self_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `isImported` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "perfis_importados_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "auto_avaliacoes_importadas";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "avaliacoes_360_importadas";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "import_history";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "perfis_importados";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "pesquisas_referencia_importadas";
PRAGMA foreign_keys=on;

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
    "periodWorked" TEXT,
    "motivationToWorkAgain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "importBatchId" TEXT,
    CONSTRAINT "assessments_360_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_assessments_360" ("authorId", "createdAt", "cycle", "evaluatedUserId", "id", "importBatchId", "improvements", "overallScore", "status", "strengths", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "evaluatedUserId", "id", "importBatchId", "improvements", "overallScore", "status", "strengths", "submittedAt", "updatedAt" FROM "assessments_360";
DROP TABLE "assessments_360";
ALTER TABLE "new_assessments_360" RENAME TO "assessments_360";
CREATE UNIQUE INDEX "assessments_360_authorId_evaluatedUserId_cycle_key" ON "assessments_360"("authorId", "evaluatedUserId", "cycle");
CREATE TABLE "new_committee_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "committee_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "committee_assessments_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_committee_assessments" ("authorId", "createdAt", "cycle", "evaluatedUserId", "finalScore", "id", "justification", "observations", "status", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "evaluatedUserId", "finalScore", "id", "justification", "observations", "status", "submittedAt", "updatedAt" FROM "committee_assessments";
DROP TABLE "committee_assessments";
ALTER TABLE "new_committee_assessments" RENAME TO "committee_assessments";
CREATE UNIQUE INDEX "committee_assessments_authorId_evaluatedUserId_cycle_key" ON "committee_assessments"("authorId", "evaluatedUserId", "cycle");
CREATE TABLE "new_evaluation_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "phase" TEXT NOT NULL DEFAULT 'ASSESSMENTS',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "assessmentDeadline" DATETIME,
    "managerDeadline" DATETIME,
    "equalizationDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_evaluation_cycles" ("assessmentDeadline", "createdAt", "endDate", "equalizationDeadline", "id", "managerDeadline", "name", "phase", "startDate", "status", "updatedAt") SELECT "assessmentDeadline", "createdAt", "endDate", "equalizationDeadline", "id", "managerDeadline", "name", "phase", "startDate", "status", "updatedAt" FROM "evaluation_cycles";
DROP TABLE "evaluation_cycles";
ALTER TABLE "new_evaluation_cycles" RENAME TO "evaluation_cycles";
CREATE UNIQUE INDEX "evaluation_cycles_name_key" ON "evaluation_cycles"("name");
CREATE TABLE "new_import_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "uploadedUserId" TEXT,
    CONSTRAINT "import_batches_uploadedUserId_fkey" FOREIGN KEY ("uploadedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_import_batches" ("fileName", "id", "importedAt", "notes", "status") SELECT "fileName", "id", "importedAt", "notes", "status" FROM "import_batches";
DROP TABLE "import_batches";
ALTER TABLE "new_import_batches" RENAME TO "import_batches";
CREATE TABLE "new_manager_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "manager_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manager_assessments_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_manager_assessments" ("authorId", "createdAt", "cycle", "evaluatedUserId", "id", "status", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "evaluatedUserId", "id", "status", "submittedAt", "updatedAt" FROM "manager_assessments";
DROP TABLE "manager_assessments";
ALTER TABLE "new_manager_assessments" RENAME TO "manager_assessments";
CREATE UNIQUE INDEX "manager_assessments_authorId_evaluatedUserId_cycle_key" ON "manager_assessments"("authorId", "evaluatedUserId", "cycle");
CREATE TABLE "new_mentoring_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "mentoring_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mentoring_assessments_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mentoring_assessments" ("authorId", "createdAt", "cycle", "id", "justification", "mentorId", "score", "status", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "id", "justification", "mentorId", "score", "status", "submittedAt", "updatedAt" FROM "mentoring_assessments";
DROP TABLE "mentoring_assessments";
ALTER TABLE "new_mentoring_assessments" RENAME TO "mentoring_assessments";
CREATE UNIQUE INDEX "mentoring_assessments_authorId_mentorId_cycle_key" ON "mentoring_assessments"("authorId", "mentorId", "cycle");
CREATE TABLE "new_reference_feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "referencedUserId" TEXT NOT NULL,
    "topic" TEXT,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "importBatchId" TEXT,
    CONSTRAINT "reference_feedbacks_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_referencedUserId_fkey" FOREIGN KEY ("referencedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reference_feedbacks" ("authorId", "createdAt", "cycle", "id", "importBatchId", "justification", "referencedUserId", "status", "submittedAt", "topic", "updatedAt") SELECT "authorId", "createdAt", "cycle", "id", "importBatchId", "justification", "referencedUserId", "status", "submittedAt", "topic", "updatedAt" FROM "reference_feedbacks";
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
    "importBatchId" TEXT,
    CONSTRAINT "self_assessments_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "self_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_self_assessments" ("authorId", "createdAt", "cycle", "id", "importBatchId", "status", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "id", "importBatchId", "status", "submittedAt", "updatedAt" FROM "self_assessments";
DROP TABLE "self_assessments";
ALTER TABLE "new_self_assessments" RENAME TO "self_assessments";
CREATE UNIQUE INDEX "self_assessments_authorId_cycle_key" ON "self_assessments"("authorId", "cycle");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "careerTrack" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "businessHub" TEXT,
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
INSERT INTO "new_users" ("businessUnit", "careerTrack", "createdAt", "directReports", "email", "id", "importBatchId", "isActive", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt") SELECT "businessUnit", "careerTrack", "createdAt", "directReports", "email", "id", "importBatchId", "isActive", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "projects", "roles", "seniority", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
