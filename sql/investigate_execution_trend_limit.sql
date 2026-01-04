-- Investigation: Execution Trend Data Limit Issue
-- Problem: Execution Trend chart shows only 1000 executions but Execution History shows 1343
-- This query investigates the data limit issue

-- Replace with actual client_id when running
-- SET client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- 1. Count total executions in last 24 hours
SELECT 
  'Total executions (last 24h)' as metric,
  COUNT(*) as count
FROM n8n_executions e
INNER JOIN n8n_workflows w ON e.workflow_id = w.id
WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND e.started_at >= NOW() - INTERVAL '24 hours'
  AND e.mode = 'production';

-- 2. Count executions when limited to 1000 (ordered by started_at DESC, most recent first)
SELECT 
  'Executions with limit 1000 (most recent first)' as metric,
  COUNT(*) as count
FROM (
  SELECT e.id
  FROM n8n_executions e
  INNER JOIN n8n_workflows w ON e.workflow_id = w.id
  WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    AND e.started_at >= NOW() - INTERVAL '24 hours'
    AND e.mode = 'production'
  ORDER BY e.started_at DESC
  LIMIT 1000
) limited;

-- 3. Show oldest 343 executions (the ones that are being cut off)
SELECT 
  'Oldest executions (being cut off)' as info,
  e.id,
  e.started_at,
  w.name as workflow_name,
  e.status,
  ROW_NUMBER() OVER (ORDER BY e.started_at ASC) as oldest_rank
FROM n8n_executions e
INNER JOIN n8n_workflows w ON e.workflow_id = w.id
WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND e.started_at >= NOW() - INTERVAL '24 hours'
  AND e.mode = 'production'
ORDER BY e.started_at ASC
LIMIT 343;

-- 4. Count executions by 2-hour intervals (UTC time)
SELECT 
  DATE_TRUNC('hour', e.started_at) + 
  (EXTRACT(HOUR FROM e.started_at)::int / 2 * 2 || ' hours')::interval as interval_start_utc,
  COUNT(*) as execution_count
FROM n8n_executions e
INNER JOIN n8n_workflows w ON e.workflow_id = w.id
WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND e.started_at >= NOW() - INTERVAL '24 hours'
  AND e.mode = 'production'
GROUP BY DATE_TRUNC('hour', e.started_at) + (EXTRACT(HOUR FROM e.started_at)::int / 2 * 2 || ' hours')::interval
ORDER BY interval_start_utc ASC;

-- 5. Compare: All executions vs Limited to 1000 (showing which intervals are affected)
WITH all_executions AS (
  SELECT 
    DATE_TRUNC('hour', e.started_at) + 
    (EXTRACT(HOUR FROM e.started_at)::int / 2 * 2 || ' hours')::interval as interval_start_utc,
    COUNT(*) as total_count
  FROM n8n_executions e
  INNER JOIN n8n_workflows w ON e.workflow_id = w.id
  WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    AND e.started_at >= NOW() - INTERVAL '24 hours'
    AND e.mode = 'production'
  GROUP BY DATE_TRUNC('hour', e.started_at) + (EXTRACT(HOUR FROM e.started_at)::int / 2 * 2 || ' hours')::interval
),
limited_executions AS (
  SELECT 
    DATE_TRUNC('hour', e.started_at) + 
    (EXTRACT(HOUR FROM e.started_at)::int / 2 * 2 || ' hours')::interval as interval_start_utc,
    COUNT(*) as limited_count
  FROM (
    SELECT e.started_at
    FROM n8n_executions e
    INNER JOIN n8n_workflows w ON e.workflow_id = w.id
    WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
      AND e.started_at >= NOW() - INTERVAL '24 hours'
      AND e.mode = 'production'
    ORDER BY e.started_at DESC
    LIMIT 1000
  ) limited
  GROUP BY DATE_TRUNC('hour', limited.started_at) + (EXTRACT(HOUR FROM limited.started_at)::int / 2 * 2 || ' hours')::interval
)
SELECT 
  COALESCE(a.interval_start_utc, l.interval_start_utc) as interval_start_utc,
  COALESCE(a.total_count, 0) as total_count,
  COALESCE(l.limited_count, 0) as limited_count,
  COALESCE(a.total_count, 0) - COALESCE(l.limited_count, 0) as missing_count
FROM all_executions a
FULL OUTER JOIN limited_executions l ON a.interval_start_utc = l.interval_start_utc
ORDER BY COALESCE(a.interval_start_utc, l.interval_start_utc) ASC;

