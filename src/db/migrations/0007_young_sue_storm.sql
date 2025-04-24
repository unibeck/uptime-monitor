CREATE TABLE `endpointMonitors` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`checkInterval` integer NOT NULL,
	`isRunning` integer DEFAULT true NOT NULL,
	`expectedStatusCode` integer,
	`consecutiveFailures` integer DEFAULT 0 NOT NULL,
	`activeAlert` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
