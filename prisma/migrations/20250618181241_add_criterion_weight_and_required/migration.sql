-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_criteria" ("createdAt", "description", "id", "isActive", "name", "pillar", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "name", "pillar", "updatedAt" FROM "criteria";
DROP TABLE "criteria";
ALTER TABLE "new_criteria" RENAME TO "criteria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
