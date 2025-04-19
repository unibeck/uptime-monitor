PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_uptimeChecks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`websiteId` text NOT NULL,
	`timestamp` integer NOT NULL,
	`status` integer,
	`responseTime` integer,
	`isUp` integer NOT NULL,
	FOREIGN KEY (`websiteId`) REFERENCES `websites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_uptimeChecks`("id", "websiteId", "timestamp", "status", "responseTime", "isUp") SELECT "id", "websiteId", "timestamp", "status", "responseTime", "isUp" FROM `uptimeChecks`;--> statement-breakpoint
DROP TABLE `uptimeChecks`;--> statement-breakpoint
ALTER TABLE `__new_uptimeChecks` RENAME TO `uptimeChecks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;