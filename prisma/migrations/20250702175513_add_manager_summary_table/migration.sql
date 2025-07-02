-- CreateTable
CREATE TABLE "manager_team_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "scoreAnalysisSummary" TEXT NOT NULL,
    "feedbackAnalysisSummary" TEXT NOT NULL,
    "totalCollaborators" INTEGER NOT NULL,
    "teamAverageScore" REAL NOT NULL,
    "highPerformers" INTEGER NOT NULL,
    "lowPerformers" INTEGER NOT NULL,
    "behaviorAverage" REAL,
    "executionAverage" REAL,
    "criticalPerformers" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "manager_team_summaries_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "manager_team_summaries_managerId_cycle_key" ON "manager_team_summaries"("managerId", "cycle");
