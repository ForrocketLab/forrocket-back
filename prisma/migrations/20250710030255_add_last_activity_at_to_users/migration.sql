-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_activity_at" DATETIME;

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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "importBatchId" TEXT,
    CONSTRAINT "assessments_360_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_assessments_360" ("authorId", "createdAt", "cycle", "evaluatedUserId", "id", "importBatchId", "improvements", "motivationToWorkAgain", "overallScore", "periodWorked", "status", "strengths", "submittedAt", "updatedAt") SELECT "authorId", "createdAt", "cycle", "evaluatedUserId", "id", "importBatchId", "improvements", "motivationToWorkAgain", "overallScore", "periodWorked", "status", "strengths", "submittedAt", "updatedAt" FROM "assessments_360";
DROP TABLE "assessments_360";
ALTER TABLE "new_assessments_360" RENAME TO "assessments_360";
CREATE UNIQUE INDEX "assessments_360_authorId_evaluatedUserId_cycle_key" ON "assessments_360"("authorId", "evaluatedUserId", "cycle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
