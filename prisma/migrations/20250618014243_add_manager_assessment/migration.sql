-- CreateTable
CREATE TABLE "manager_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "manager_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manager_assessments_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manager_assessment_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerAssessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    CONSTRAINT "manager_assessment_answers_managerAssessmentId_fkey" FOREIGN KEY ("managerAssessmentId") REFERENCES "manager_assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "manager_assessments_authorId_evaluatedUserId_cycle_key" ON "manager_assessments"("authorId", "evaluatedUserId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "manager_assessment_answers_managerAssessmentId_criterionId_key" ON "manager_assessment_answers"("managerAssessmentId", "criterionId");
