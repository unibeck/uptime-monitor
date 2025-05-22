-- Step 1: Add alertThreshold column as nullable
ALTER TABLE `endpointMonitors` ADD COLUMN `alertThreshold` integer;--> statement-breakpoint

-- Step 2: Set all existing endpoint monitor alertThreshold values to 2
UPDATE `endpointMonitors` SET `alertThreshold` = 2;--> statement-breakpoint

-- Step 3: Update column to non-nullable with default value of 2
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_endpointMonitors` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`checkInterval` integer NOT NULL,
	`isRunning` integer DEFAULT true NOT NULL,
	`expectedStatusCode` integer,
	`consecutiveFailures` integer DEFAULT 0 NOT NULL,
	`alertThreshold` integer DEFAULT 2 NOT NULL,
	`activeAlert` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint

INSERT INTO `__new_endpointMonitors` (
    `id`,
    `url`,
    `name`,
    `checkInterval`,
    `isRunning`,
    `expectedStatusCode`,
    `consecutiveFailures`,
    `alertThreshold`,
    `activeAlert`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `url`,
    `name`,
    `checkInterval`,
    `isRunning`,
    `expectedStatusCode`,
    `consecutiveFailures`,
    `alertThreshold`,
    `activeAlert`,
    `createdAt`,
    `updatedAt`
FROM `endpointMonitors`;--> statement-breakpoint

DROP TABLE `endpointMonitors`;--> statement-breakpoint
ALTER TABLE `__new_endpointMonitors` RENAME TO `endpointMonitors`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
