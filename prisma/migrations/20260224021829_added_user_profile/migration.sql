-- CreateTable
CREATE TABLE "Division" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "divisionId" UUID,
    "position" VARCHAR(150),
    "phone" VARCHAR(50),
    "employeeNo" VARCHAR(50),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_code_key" ON "Division"("code");

-- CreateIndex
CREATE INDEX "Division_isActive_sortOrder_idx" ON "Division"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "UserProfile_divisionId_idx" ON "UserProfile"("divisionId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
