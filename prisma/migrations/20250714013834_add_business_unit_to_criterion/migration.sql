-- AlterTable
ALTER TABLE "criteria" ADD COLUMN "businessUnit" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_self_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
