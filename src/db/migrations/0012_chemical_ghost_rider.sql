CREATE TABLE `emailNotificationChannels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emailAddress` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `endpointMonitorEmailChannels` (
	`endpointMonitorId` text NOT NULL,
	`emailChannelId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	PRIMARY KEY(`endpointMonitorId`, `emailChannelId`),
	FOREIGN KEY (`endpointMonitorId`) REFERENCES `endpointMonitors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`emailChannelId`) REFERENCES `emailNotificationChannels`(`id`) ON UPDATE no action ON DELETE cascade
);
