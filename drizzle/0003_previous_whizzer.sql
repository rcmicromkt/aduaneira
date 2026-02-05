ALTER TABLE `invoices` ADD `dollarValue` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` DROP COLUMN `dollarValue`;