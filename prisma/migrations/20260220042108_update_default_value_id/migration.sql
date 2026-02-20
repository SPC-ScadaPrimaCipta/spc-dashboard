-- AlterTable
ALTER TABLE "ResourceType" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ScheduleResource" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
