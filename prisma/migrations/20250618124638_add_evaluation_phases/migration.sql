-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_evaluation_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "phase" TEXT NOT NULL DEFAULT 'ASSESSMENTS',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_evaluation_cycles" ("createdAt", "endDate", "id", "name", "startDate", "status", "updatedAt") SELECT "createdAt", "endDate", "id", "name", "startDate", "status", "updatedAt" FROM "evaluation_cycles";
DROP TABLE "evaluation_cycles";
ALTER TABLE "new_evaluation_cycles" RENAME TO "evaluation_cycles";
CREATE UNIQUE INDEX "evaluation_cycles_name_key" ON "evaluation_cycles"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
