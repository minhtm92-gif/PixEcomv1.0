-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEADER', 'MEDIA', 'VIEWER');
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "AssetType" AS ENUM ('VIDEO', 'IMAGE', 'THUMBNAIL', 'ADTEXT', 'ADPOST');
CREATE TYPE "DraftSource" AS ENUM ('EXISTING_POST', 'CONTENT_SOURCE');

CREATE TABLE "Merchant" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "passwordHash" TEXT NOT NULL, "name" TEXT NOT NULL, "role" "Role" NOT NULL, "merchantId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Product" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "status" "Status" NOT NULL DEFAULT 'ACTIVE', "merchantId" TEXT NOT NULL);
CREATE TABLE "Sellpage" ("id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL, "domain" TEXT NOT NULL, "status" "Status" NOT NULL DEFAULT 'ACTIVE', "config" JSONB, "productId" TEXT NOT NULL, "merchantId" TEXT NOT NULL);
CREATE TABLE "Order" ("id" TEXT PRIMARY KEY, "sellpageId" TEXT NOT NULL, "source" TEXT NOT NULL, "revenueCents" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "CreativeAsset" ("id" TEXT PRIMARY KEY, "type" "AssetType" NOT NULL, "version" TEXT NOT NULL, "url" TEXT NOT NULL, "preview" TEXT, "textContent" TEXT, "spentCents" INTEGER NOT NULL DEFAULT 0, "roas" DOUBLE PRECISION NOT NULL DEFAULT 0, "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0, "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0, "productId" TEXT NOT NULL);
CREATE TABLE "AdAccount" ("id" TEXT PRIMARY KEY, "platformId" TEXT NOT NULL, "name" TEXT NOT NULL, "currency" TEXT NOT NULL, "timezone" TEXT NOT NULL, "merchantId" TEXT NOT NULL);
CREATE TABLE "Campaign" ("id" TEXT PRIMARY KEY, "platformId" TEXT NOT NULL, "name" TEXT NOT NULL, "status" "Status" NOT NULL, "deliveryStatus" TEXT NOT NULL DEFAULT 'Active', "dailyBudgetCents" INTEGER NOT NULL, "spendCents" INTEGER NOT NULL, "startDate" TIMESTAMP(3) NOT NULL, "objective" TEXT NOT NULL, "aiAssistant" BOOLEAN NOT NULL DEFAULT false, "merchantId" TEXT NOT NULL, "adAccountId" TEXT NOT NULL, "lastSyncAt" TIMESTAMP(3));
CREATE TABLE "AdSet" ("id" TEXT PRIMARY KEY, "platformId" TEXT NOT NULL, "name" TEXT NOT NULL, "status" "Status" NOT NULL, "deliveryStatus" TEXT NOT NULL DEFAULT 'Active', "budgetCents" INTEGER NOT NULL, "spendCents" INTEGER NOT NULL, "targeting" JSONB, "aiAssistant" BOOLEAN NOT NULL DEFAULT false, "merchantId" TEXT NOT NULL, "campaignId" TEXT NOT NULL);
CREATE TABLE "Ad" ("id" TEXT PRIMARY KEY, "platformId" TEXT NOT NULL, "name" TEXT NOT NULL, "status" "Status" NOT NULL, "deliveryStatus" TEXT NOT NULL DEFAULT 'Active', "spendCents" INTEGER NOT NULL, "metrics" JSONB, "aiAssistant" BOOLEAN NOT NULL DEFAULT false, "merchantId" TEXT NOT NULL, "adSetId" TEXT NOT NULL, "creativeAssetId" TEXT);
CREATE TABLE "AdCreationDraft" ("id" TEXT PRIMARY KEY, "merchantId" TEXT NOT NULL, "strategy" TEXT NOT NULL, "sellpageId" TEXT, "adAccountId" TEXT, "budgetCents" INTEGER, "audience" TEXT, "sourceType" "DraftSource", "payload" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);

ALTER TABLE "User" ADD CONSTRAINT "User_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Product" ADD CONSTRAINT "Product_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Sellpage" ADD CONSTRAINT "Sellpage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id");
ALTER TABLE "Sellpage" ADD CONSTRAINT "Sellpage_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellpageId_fkey" FOREIGN KEY ("sellpageId") REFERENCES "Sellpage"("id");
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id");
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id");
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id");
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "AdSet"("id");
ALTER TABLE "AdCreationDraft" ADD CONSTRAINT "AdCreationDraft_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id");
