ALTER TABLE `invoiceItems` ADD `costValue` decimal(12,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoiceItems` ADD `costCurrency` enum('USD','BRL') DEFAULT 'BRL' NOT NULL;