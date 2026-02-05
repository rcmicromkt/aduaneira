ALTER TABLE `clients` ADD `portOrigin` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `portDestination` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `port`;