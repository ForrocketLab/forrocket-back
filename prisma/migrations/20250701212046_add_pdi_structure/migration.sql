-- CreateTable
CREATE TABLE "pdis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collaboratorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "pdis_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pdi_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pdiId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_DO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "pdi_actions_pdiId_fkey" FOREIGN KEY ("pdiId") REFERENCES "pdis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
