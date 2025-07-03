-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pdis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaboratorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "pdis_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pdis" ("collaboratorId", "completedAt", "createdAt", "description", "endDate", "id", "startDate", "status", "title", "updatedAt") SELECT "collaboratorId", "completedAt", "createdAt", "description", "endDate", "id", "startDate", "status", "title", "updatedAt" FROM "pdis";
DROP TABLE "pdis";
ALTER TABLE "new_pdis" RENAME TO "pdis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
