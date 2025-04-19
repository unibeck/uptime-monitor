CREATE TABLE `uptimeChecks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`websiteId` text NOT NULL,
	`timestamp` integer NOT NULL,
	`status` integer,
	`responseTime` integer,
	`isUp` integer NOT NULL,
	FOREIGN KEY (`websiteId`) REFERENCES `websites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `websites` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`checkInterval` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
