-- AlterTable
ALTER TABLE "projects" ADD COLUMN "leaderId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "directLeadership" TEXT;
ALTER TABLE "users" ADD COLUMN "leaderId" TEXT;
ALTER TABLE "users" ADD COLUMN "mentoringIds" TEXT;
