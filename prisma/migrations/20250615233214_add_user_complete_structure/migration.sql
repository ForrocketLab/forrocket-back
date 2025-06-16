-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "careerTrack" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "projects" TEXT,
    "managerId" TEXT,
    "directReports" TEXT,
    "mentorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
