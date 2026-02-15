/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Label` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Label" ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ALTER COLUMN "updatedById" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "color" VARCHAR(20),
ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ALTER COLUMN "updatedById" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TaskAuditTrail" ALTER COLUMN "byUserId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TaskComment" ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ALTER COLUMN "updatedById" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TaskLabel" ALTER COLUMN "assignedById" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TaskStatus" ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ALTER COLUMN "updatedById" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAssignment_assigneeId_idx" ON "TaskAssignment"("assigneeId");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_assigneeId_taskId_idx" ON "TaskAssignment"("assigneeId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_assigneeId_key" ON "TaskAssignment"("taskId", "assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_slug_key" ON "Label"("slug");

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
