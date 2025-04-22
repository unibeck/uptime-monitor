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
INSERT INTO `__new_uptimeChecks`("id", "endpointMonitorId", "timestamp", "status", "responseTime", "isExpectedStatus") SELECT "id", "endpointMonitorId", "timestamp", "status", "responseTime", "isExpectedStatus" FROM `uptimeChecks`;--> statement-breakpoint
DROP TABLE `uptimeChecks`;--> statement-breakpoint
ALTER TABLE `__new_uptimeChecks` RENAME TO `uptimeChecks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;