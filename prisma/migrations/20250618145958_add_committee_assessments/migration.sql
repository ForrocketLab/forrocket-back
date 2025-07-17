-- CreateTable
CREATE TABLE "committee_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "committee_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "committee_assessments_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "committee_assessments_authorId_evaluatedUserId_cycle_key" ON "committee_assessments"("authorId", "evaluatedUserId", "cycle");
