-- CalConnect: MANUAL SETUP (only if Vercel deploy migrations fail)
-- Run in Supabase → SQL Editor → New query
-- Creates tables. Then visit your-app.vercel.app/api/seed to load resources.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: SCHEMA (skip if tables already exist)
-- ═══════════════════════════════════════════════════════════════════════════

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "public"."UserRole" AS ENUM ('student', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."ProviderOrgType" AS ENUM ('office', 'student_org', 'external_partner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Category
CREATE TABLE IF NOT EXISTS "public"."Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "public"."Category"("slug");

-- CreateTable Location
CREATE TABLE IF NOT EXISTS "public"."Location" (
  "id" TEXT NOT NULL,
  "buildingName" TEXT,
  "room" TEXT,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable Tag
CREATE TABLE IF NOT EXISTS "public"."Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_type_key" ON "public"."Tag"("name", "type");

-- CreateTable Provider
CREATE TABLE IF NOT EXISTS "public"."Provider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactEmail" TEXT,
  "campusOrgType" "public"."ProviderOrgType" NOT NULL DEFAULT 'office',
  CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable Resource
CREATE TABLE IF NOT EXISTS "public"."Resource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "fullDescription" TEXT,
  "eligibilityText" TEXT NOT NULL,
  "isAppointmentRequired" BOOLEAN NOT NULL DEFAULT false,
  "walkInAllowed" BOOLEAN NOT NULL DEFAULT true,
  "whatToBring" TEXT[] DEFAULT '{}',
  "requirementsLink" TEXT,
  "websiteUrl" TEXT,
  "officialUrl" TEXT,
  "hoursJson" JSONB,
  "summaryJson" JSONB,
  "faqJson" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastScrapedAt" TIMESTAMP(3),
  "lastSummarizedAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT NOT NULL,
  "locationId" TEXT,
  "providerId" TEXT,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Resource_name_idx" ON "public"."Resource"("name");
CREATE INDEX IF NOT EXISTS "Resource_categoryId_idx" ON "public"."Resource"("categoryId");

-- CreateTable ResourceTag
CREATE TABLE IF NOT EXISTS "public"."ResourceTag" (
  "resourceId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("resourceId","tagId")
);

-- CreateTable User
CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" TEXT NOT NULL,
  "campusSsoId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "public"."UserRole" NOT NULL DEFAULT 'student',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_campusSsoId_key" ON "public"."User"("campusSsoId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");

-- CreateTable UserProfile
CREATE TABLE IF NOT EXISTS "public"."UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateTable SearchCache
CREATE TABLE IF NOT EXISTS "public"."SearchCache" (
  "id" TEXT NOT NULL,
  "queryKey" TEXT NOT NULL,
  "resultJson" JSONB NOT NULL,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SearchCache_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SearchCache_queryKey_key" ON "public"."SearchCache"("queryKey");
CREATE INDEX IF NOT EXISTS "SearchCache_expiresAt_idx" ON "public"."SearchCache"("expiresAt");

-- CreateTable ScrapedPage
CREATE TABLE IF NOT EXISTS "public"."ScrapedPage" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT '{}',
  "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScrapedPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScrapedPage_url_key" ON "public"."ScrapedPage"("url");
CREATE INDEX IF NOT EXISTS "ScrapedPage_category_idx" ON "public"."ScrapedPage"("category");
CREATE INDEX IF NOT EXISTS "ScrapedPage_domain_idx" ON "public"."ScrapedPage"("domain");

-- Foreign keys (ignore if exist)
DO $$ BEGIN
  ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ResourceTag" ADD CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ResourceTag" ADD CONSTRAINT "ResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: SEED DATA (run only once; safe to re-run — skips existing)
-- ═══════════════════════════════════════════════════════════════════════════

-- Categories and Tags are seeded by /api/seed. Run the schema above, then visit /api/seed.
