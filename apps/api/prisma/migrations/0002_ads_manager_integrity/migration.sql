CREATE TYPE "EntityType" AS ENUM ('CAMPAIGN', 'ADSET', 'AD');
CREATE TYPE "BudgetSourceUnit" AS ENUM ('MAJOR', 'MINOR');

ALTER TABLE "Campaign" ADD COLUMN "configuredStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Campaign" ADD COLUMN "effectiveStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Campaign" ADD COLUMN "budgetSourceUnit" "BudgetSourceUnit" NOT NULL DEFAULT 'MINOR';
ALTER TABLE "Campaign" ADD COLUMN "lastSeenSyncRunId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Campaign" SET "configuredStatus" = "status", "effectiveStatus" = "status";
ALTER TABLE "Campaign" DROP COLUMN "status";
CREATE INDEX "Campaign_platformId_idx" ON "Campaign"("platformId");

ALTER TABLE "AdSet" ADD COLUMN "configuredStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AdSet" ADD COLUMN "effectiveStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AdSet" ADD COLUMN "lastSeenSyncRunId" TEXT;
ALTER TABLE "AdSet" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
UPDATE "AdSet" SET "configuredStatus" = "status", "effectiveStatus" = "status";
ALTER TABLE "AdSet" DROP COLUMN "status";

ALTER TABLE "Ad" ADD COLUMN "configuredStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Ad" ADD COLUMN "effectiveStatus" "Status" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Ad" ADD COLUMN "lastSeenSyncRunId" TEXT;
ALTER TABLE "Ad" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Ad" SET "configuredStatus" = "status", "effectiveStatus" = "status";
ALTER TABLE "Ad" DROP COLUMN "status";

CREATE TABLE "MetricsDaily" (
  "id" TEXT PRIMARY KEY,
  "entityType" "EntityType" NOT NULL,
  "platformId" TEXT NOT NULL,
  "metricDate" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "spendCents" INTEGER NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "MetricsDaily_entityType_platformId_metricDate_timezone_key" ON "MetricsDaily"("entityType", "platformId", "metricDate", "timezone");
CREATE INDEX "MetricsDaily_entityType_platformId_metricDate_idx" ON "MetricsDaily"("entityType", "platformId", "metricDate");

CREATE TABLE "SyncRun" (
  "id" TEXT PRIMARY KEY,
  "merchantId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'facebook',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'running'
);
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
