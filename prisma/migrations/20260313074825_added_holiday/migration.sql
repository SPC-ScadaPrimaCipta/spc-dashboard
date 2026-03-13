-- CreateEnum
CREATE TYPE "HolidayScopeType" AS ENUM ('GLOBAL', 'LOCATION', 'DIVISION', 'RESOURCE_TYPE');

-- CreateTable
CREATE TABLE "Holiday" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayScope" (
    "id" UUID NOT NULL,
    "holidayId" UUID NOT NULL,
    "scopeType" "HolidayScopeType" NOT NULL,
    "scopeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HolidayScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_code_key" ON "Holiday"("code");

-- CreateIndex
CREATE INDEX "Holiday_startAt_endAt_idx" ON "Holiday"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "Holiday_isActive_idx" ON "Holiday"("isActive");

-- CreateIndex
CREATE INDEX "HolidayScope_holidayId_idx" ON "HolidayScope"("holidayId");

-- CreateIndex
CREATE INDEX "HolidayScope_scopeType_scopeId_idx" ON "HolidayScope"("scopeType", "scopeId");

-- AddForeignKey
ALTER TABLE "HolidayScope" ADD CONSTRAINT "HolidayScope_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id") ON DELETE CASCADE ON UPDATE CASCADE;
