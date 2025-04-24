PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_uptimeChecks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`endpointMonitorId` text NOT NULL,
	`timestamp` integer NOT NULL,
	`status` integer,
	`responseTime` integer,
	`isExpectedStatus` integer NOT NULL,
	FOREIGN KEY (`endpointMonitorId`) REFERENCES `endpointMonitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Insert only valid rows with updated endpointMonitorId
INSERT INTO `__new_uptimeChecks` (
    "id",
    "endpointMonitorId",
    "timestamp",
    "status",
    "responseTime",
    "isExpectedStatus"
)
SELECT
    uc."id",
    REPLACE(uc."websiteId", 'webs_', 'endp_'), -- Select from websiteId and use the corrected ID
    uc."timestamp",
    uc."status",
    uc."responseTime",
    uc."isExpectedStatus"
FROM
    `uptimeChecks` uc
WHERE
    -- Ensure the corresponding monitor exists in endpointMonitors
    EXISTS (
        SELECT 1
        FROM endpointMonitors em
        WHERE em.id = REPLACE(uc."websiteId", 'webs_', 'endp_') -- Check existence using websiteId
    );
--> statement-breakpoint
DROP TABLE `uptimeChecks`;--> statement-breakpoint
ALTER TABLE `__new_uptimeChecks` RENAME TO `uptimeChecks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;