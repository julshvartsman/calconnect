-- CreateTable
CREATE TABLE "public"."SearchCache" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchCache_queryKey_key" ON "public"."SearchCache"("queryKey");

-- CreateIndex
CREATE INDEX "SearchCache_queryKey_idx" ON "public"."SearchCache"("queryKey");

-- CreateIndex
CREATE INDEX "SearchCache_expiresAt_idx" ON "public"."SearchCache"("expiresAt");
