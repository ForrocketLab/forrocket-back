/*
  Warnings:

  - You are about to drop the column `directReports` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `projects` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "evaluation_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "self_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "self_assessments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "self_assessments_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "self_assessment_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selfAssessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    CONSTRAINT "self_assessment_answers_selfAssessmentId_fkey" FOREIGN KEY ("selfAssessmentId") REFERENCES "self_assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "self_assessment_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments_360" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "evaluatedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_360_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_evaluatedUserId_fkey" FOREIGN KEY ("evaluatedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_360_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_360_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    CONSTRAINT "assessment_360_answers_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments_360" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_360_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "referencedUserId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reference_feedbacks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_referencedUserId_fkey" FOREIGN KEY ("referencedUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reference_feedbacks_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "final_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "final_evaluations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "final_evaluations_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "final_evaluation_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "finalEvaluationId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "committeeNotes" TEXT NOT NULL,
    CONSTRAINT "final_evaluation_answers_finalEvaluationId_fkey" FOREIGN KEY ("finalEvaluationId") REFERENCES "final_evaluations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "final_evaluation_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "committee_observations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "finalEvaluationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "committee_observations_finalEvaluationId_fkey" FOREIGN KEY ("finalEvaluationId") REFERENCES "final_evaluations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "committee_observations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "okrs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "keyResult" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "okrs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "okrs_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pdis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developmentGoal" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pdis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pdis_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_project_assignments" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "projectId"),
    CONSTRAINT "user_project_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_project_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "projectId" TEXT,
    "cycleId" TEXT,
    CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_role_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_role_assignments_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "evaluation_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "careerTrack" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "managerId" TEXT,
    "mentorId" TEXT,
    CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("businessUnit", "careerTrack", "createdAt", "email", "id", "isActive", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "seniority", "updatedAt") SELECT "businessUnit", "careerTrack", "createdAt", "email", "id", "isActive", "jobTitle", "managerId", "mentorId", "name", "passwordHash", "seniority", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_cycles_name_key" ON "evaluation_cycles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "self_assessments_authorId_cycleId_key" ON "self_assessments"("authorId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "self_assessment_answers_selfAssessmentId_criterionId_key" ON "self_assessment_answers"("selfAssessmentId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_360_authorId_evaluatedUserId_cycleId_key" ON "assessments_360"("authorId", "evaluatedUserId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_360_answers_assessmentId_criterionId_key" ON "assessment_360_answers"("assessmentId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "final_evaluations_userId_cycleId_key" ON "final_evaluations"("userId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "final_evaluation_answers_finalEvaluationId_criterionId_key" ON "final_evaluation_answers"("finalEvaluationId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_userId_role_projectId_cycleId_key" ON "user_role_assignments"("userId", "role", "projectId", "cycleId");
