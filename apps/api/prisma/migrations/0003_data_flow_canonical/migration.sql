CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

ALTER TABLE "Sellpage" ADD CONSTRAINT "Sellpage_slug_key" UNIQUE ("slug");

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionKey" TEXT NOT NULL UNIQUE,
  "merchantId" TEXT NOT NULL,
  "sellpageId" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "fbclid" TEXT,
  "gclid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "Session" ADD CONSTRAINT "Session_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Session" ADD CONSTRAINT "Session_sellpageId_fkey" FOREIGN KEY ("sellpageId") REFERENCES "Sellpage"("id");

CREATE TABLE "PageView" (
  "id" TEXT PRIMARY KEY,
  "merchantId" TEXT NOT NULL,
  "sellpageId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sellpageId_fkey" FOREIGN KEY ("sellpageId") REFERENCES "Sellpage"("id");
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id");

ALTER TABLE "Order" DROP COLUMN "source";
ALTER TABLE "Order" DROP COLUMN "revenueCents";
ALTER TABLE "Order" ADD COLUMN "merchantId" TEXT;
ALTER TABLE "Order" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmTerm" TEXT;
ALTER TABLE "Order" ADD COLUMN "fbclid" TEXT;
ALTER TABLE "Order" ADD COLUMN "gclid" TEXT;
ALTER TABLE "Order" ADD COLUMN "totalsCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ALTER COLUMN "merchantId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "sessionId" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Order" ADD CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id");

CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id");

ALTER TABLE "Campaign" DROP COLUMN "spendCents";
ALTER TABLE "AdSet" DROP COLUMN "spendCents";
ALTER TABLE "Ad" DROP COLUMN "spendCents";
ALTER TABLE "Campaign" ADD COLUMN "sellpageId" TEXT;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_sellpageId_fkey" FOREIGN KEY ("sellpageId") REFERENCES "Sellpage"("id");

ALTER TABLE "MetricsDaily" RENAME COLUMN "metricDate" TO "dateLocal";
DROP INDEX "MetricsDaily_entityType_platformId_metricDate_timezone_key";
DROP INDEX "MetricsDaily_entityType_platformId_metricDate_idx";
CREATE UNIQUE INDEX "MetricsDaily_entityType_platformId_dateLocal_timezone_key" ON "MetricsDaily"("entityType", "platformId", "dateLocal", "timezone");
CREATE INDEX "MetricsDaily_entityType_platformId_dateLocal_idx" ON "MetricsDaily"("entityType", "platformId", "dateLocal");

CREATE UNIQUE INDEX "AdAccount_merchantId_platformId_key" ON "AdAccount"("merchantId", "platformId");
CREATE UNIQUE INDEX "Campaign_merchantId_platformId_key" ON "Campaign"("merchantId", "platformId");
CREATE UNIQUE INDEX "AdSet_merchantId_platformId_key" ON "AdSet"("merchantId", "platformId");
CREATE UNIQUE INDEX "Ad_merchantId_platformId_key" ON "Ad"("merchantId", "platformId");
