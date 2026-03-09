-- CreateEnum
CREATE TYPE "LocationCategory" AS ENUM ('OFFICE', 'NON_OFFICE');

-- AlterTable
ALTER TABLE "Division" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ResourceType" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ScheduleResource" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "locationId" UUID;

-- AlterTable
ALTER TABLE "workflow" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_action_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_instance" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_step" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_step_instance" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" "LocationCategory" NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE INDEX "Location_category_isActive_idx" ON "Location"("category", "isActive");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
