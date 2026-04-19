-- CreateEnum (idempotent for partially-applied environments)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SearchEventType') THEN
    CREATE TYPE "SearchEventType" AS ENUM (
      'search_submitted',
      'search_results',
      'search_no_results',
      'result_clicked'
    );
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SearchEvent" (
    "id" TEXT NOT NULL,
    "eventType" "SearchEventType" NOT NULL,
    "query" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT,
    "resultCount" INTEGER,
    "durationMs" INTEGER,
    "cached" BOOLEAN,
    "success" BOOLEAN,
    "resultId" TEXT,
    "resultRank" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchEvent_createdAt_idx" ON "SearchEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchEvent_eventType_createdAt_idx" ON "SearchEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchEvent_queryKey_createdAt_idx" ON "SearchEvent"("queryKey", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchEvent_anonymousId_createdAt_idx" ON "SearchEvent"("anonymousId", "createdAt");
