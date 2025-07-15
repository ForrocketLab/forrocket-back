-- CreateTable
CREATE TABLE "ClimateSentimentAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycle" TEXT NOT NULL,
    "sentimentAnalysis" TEXT NOT NULL,
    "improvementTips" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "areasOfConcern" TEXT NOT NULL,
    "overallSentimentScore" INTEGER NOT NULL,
    "totalAssessments" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ClimateSentimentAnalysis_cycle_key" ON "ClimateSentimentAnalysis"("cycle");
