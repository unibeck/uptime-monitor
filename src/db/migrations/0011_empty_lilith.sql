CREATE TABLE `syntheticChecks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`syntheticMonitorId` text NOT NULL,
	`timestamp` integer NOT NULL,
	`statusOutcome` text NOT NULL,
	`durationMs` integer NOT NULL,
	`errorMessage` text,
	FOREIGN KEY (`syntheticMonitorId`) REFERENCES `syntheticMonitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `syntheticMonitors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`checkInterval` integer NOT NULL,
	`timeoutSeconds` integer NOT NULL,
	`runtime` text NOT NULL,
	`isRunning` integer DEFAULT true NOT NULL,
	`consecutiveFailures` integer DEFAULT 0 NOT NULL,
	`activeAlert` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
