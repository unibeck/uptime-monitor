ALTER TABLE `uptimeChecks` ADD `isExpectedStatus` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `uptimeChecks` DROP COLUMN `isUp`;