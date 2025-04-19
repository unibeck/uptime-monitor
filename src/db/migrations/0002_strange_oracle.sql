ALTER TABLE `websites` ADD `isRunning` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `websites` ADD `consecutiveFailures` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `websites` ADD `activeAlert` integer DEFAULT false NOT NULL;