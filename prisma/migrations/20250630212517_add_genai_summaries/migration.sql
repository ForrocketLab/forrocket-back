-- CreateTable
CREATE TABLE "genai_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaboratorId" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "collaboratorName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "averageScore" REAL NOT NULL,
    "totalEvaluations" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "genai_summaries_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "genai_summaries_collaboratorId_cycle_key" ON "genai_summaries"("collaboratorId", "cycle");
