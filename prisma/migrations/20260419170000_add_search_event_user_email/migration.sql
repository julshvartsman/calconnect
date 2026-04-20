-- Add userEmail to SearchEvent so authenticated users can see their own history.
ALTER TABLE "SearchEvent" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
CREATE INDEX IF NOT EXISTS "SearchEvent_userEmail_createdAt_idx"
  ON "SearchEvent"("userEmail", "createdAt");
