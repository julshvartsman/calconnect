-- Top searches in last 30 days
SELECT
  "queryKey",
  COUNT(*) AS searches
FROM "SearchEvent"
WHERE "eventType" = 'search_submitted'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "queryKey"
ORDER BY searches DESC
LIMIT 50;

-- Zero-result searches in last 30 days
SELECT
  "queryKey",
  COUNT(*) AS zero_result_searches
FROM "SearchEvent"
WHERE "eventType" = 'search_no_results'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "queryKey"
ORDER BY zero_result_searches DESC
LIMIT 50;

-- Click-through rate by query in last 30 days
WITH submitted AS (
  SELECT "queryKey", COUNT(*) AS submitted_count
  FROM "SearchEvent"
  WHERE "eventType" = 'search_submitted'
    AND "createdAt" >= NOW() - INTERVAL '30 days'
  GROUP BY "queryKey"
),
clicked AS (
  SELECT "queryKey", COUNT(*) AS clicked_count
  FROM "SearchEvent"
  WHERE "eventType" = 'result_clicked'
    AND "createdAt" >= NOW() - INTERVAL '30 days'
  GROUP BY "queryKey"
)
SELECT
  s."queryKey",
  s.submitted_count,
  COALESCE(c.clicked_count, 0) AS clicked_count,
  ROUND((COALESCE(c.clicked_count, 0)::numeric / NULLIF(s.submitted_count, 0)) * 100, 2) AS ctr_percent
FROM submitted s
LEFT JOIN clicked c ON c."queryKey" = s."queryKey"
ORDER BY ctr_percent DESC, s.submitted_count DESC
LIMIT 100;
