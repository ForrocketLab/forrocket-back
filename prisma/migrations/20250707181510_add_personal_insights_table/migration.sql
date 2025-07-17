-- CreateTable
CREATE TABLE "personal_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaboratorId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "collaboratorName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "averageScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "personal_insights_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_insights_collaboratorId_cycle_key" ON "personal_insights"("collaboratorId", "cycle");
