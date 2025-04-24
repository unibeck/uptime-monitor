-- Custom SQL migration file, put your code below! --

-- Step 1: Copy all rows from websites to endpointMonitors
INSERT INTO endpointMonitors (
    id,
    url,
    name,
    checkInterval,
    isRunning,
    expectedStatusCode,
    consecutiveFailures,
    activeAlert,
    createdAt,
    updatedAt
)
SELECT
    id,
    url,
    name,
    checkInterval,
    isRunning,
    expectedStatusCode,
    consecutiveFailures,
    activeAlert,
    createdAt,
    updatedAt
FROM websites;

-- Step 2: Update the IDs in endpointMonitors to replace 'webs_' with 'endp_'
UPDATE endpointMonitors
SET id = REPLACE(id, 'webs_', 'endp_')
WHERE id LIKE 'webs_%';
