-- CreateTable
CREATE TABLE "public"."ScrapedPage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "keywords" TEXT[],
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapedPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedPage_url_key" ON "public"."ScrapedPage"("url");

-- CreateIndex
CREATE INDEX "ScrapedPage_category_idx" ON "public"."ScrapedPage"("category");

-- CreateIndex
CREATE INDEX "ScrapedPage_domain_idx" ON "public"."ScrapedPage"("domain");
