-- CreateTable
CREATE TABLE "climate_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "climate_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "climate_assessment_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "climateAssessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    CONSTRAINT "climate_assessment_answers_climateAssessmentId_fkey" FOREIGN KEY ("climateAssessmentId") REFERENCES "climate_assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "climate_assessment_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedBy" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" DATETIME,
    CONSTRAINT "climate_assessment_configs_activatedBy_fkey" FOREIGN KEY ("activatedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "climate_assessments_authorId_cycle_key" ON "climate_assessments"("authorId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "climate_assessment_answers_climateAssessmentId_criterionId_key" ON "climate_assessment_answers"("climateAssessmentId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "climate_assessment_configs_cycle_key" ON "climate_assessment_configs"("cycle");
