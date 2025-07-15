-- CreateTable
CREATE TABLE "RemovedCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "removedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "RemovedCriterion_criterionId_businessUnit_key" ON "RemovedCriterion"("criterionId", "businessUnit");
