CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`feeId` int NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`currency` enum('USD','BRL') NOT NULL DEFAULT 'BRL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `operationFees`;--> statement-breakpoint
ALTER TABLE `fees` ADD `description` text;--> statement-breakpoint
ALTER TABLE `operations` ADD `supplierId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `dollarValue` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `supplierId`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `costValue`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `costCurrency`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `exchangeRate`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `sellingValue`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `markup`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `fees` DROP COLUMN `notes`;