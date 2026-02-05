-- Banco de dados: Desembaraço Aduaneiro
-- Criado automaticamente com base no schema.ts

CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

CREATE TABLE `clients` (
  `id` int AUTO_INCREMENT NOT NULL,
  `shipper` varchar(255) NOT NULL,
  `consignee` varchar(255) NOT NULL,
  `cnpj` varchar(20) NOT NULL,
  `portOrigin` varchar(100),
  `portDestination` varchar(100),
  `weight` decimal(12, 2),
  `notify` varchar(255),
  `bl` varchar(100) NOT NULL,
  `blDate` timestamp NOT NULL,
  `invoiceNumber` varchar(100),
  `referenceNumber` varchar(100) NOT NULL,
  `birthDate` timestamp,
  `freightType` enum('FOB', 'EXW') NOT NULL,
  `contactName` varchar(255),
  `contactEmail` varchar(255),
  `contactPhone` varchar(20),
  `address` text,
  `city` varchar(100),
  `state` varchar(2),
  `zipCode` varchar(10),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `clients_id` PRIMARY KEY(`id`),
  CONSTRAINT `clients_cnpj_unique` UNIQUE(`cnpj`),
  CONSTRAINT `clients_referenceNumber_unique` UNIQUE(`referenceNumber`)
);

CREATE TABLE `suppliers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `cnpj` varchar(20) NOT NULL,
  `contactName` varchar(255),
  `contactEmail` varchar(255),
  `contactPhone` varchar(20),
  `serviceType` varchar(100) NOT NULL,
  `address` text,
  `city` varchar(100),
  `state` varchar(2),
  `zipCode` varchar(10),
  `bankAccount` varchar(50),
  `bankName` varchar(100),
  `notes` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
  CONSTRAINT `suppliers_cnpj_unique` UNIQUE(`cnpj`)
);

CREATE TABLE `fees` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fees_id` PRIMARY KEY(`id`)
);

CREATE TABLE `operations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `referenceNumber` varchar(100) NOT NULL,
  `clientId` int NOT NULL,
  `supplierId` int NOT NULL,
  `status` enum('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `totalCost` decimal(12, 2) NOT NULL DEFAULT '0',
  `totalSelling` decimal(12, 2) NOT NULL DEFAULT '0',
  `totalProfit` decimal(12, 2) NOT NULL DEFAULT '0',
  `profitMargin` decimal(5, 2) NOT NULL DEFAULT '0',
  `iofValue` decimal(12, 2) DEFAULT '0',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `operations_id` PRIMARY KEY(`id`),
  CONSTRAINT `operations_referenceNumber_unique` UNIQUE(`referenceNumber`)
);

CREATE TABLE `invoices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `invoiceNumber` varchar(100) NOT NULL,
  `operationId` int NOT NULL,
  `clientId` int NOT NULL,
  `dollarValue` decimal(10, 2) NOT NULL,
  `status` enum('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  `totalAmount` decimal(12, 2) NOT NULL,
  `iofAmount` decimal(12, 2) DEFAULT '0',
  `finalAmount` decimal(12, 2) NOT NULL,
  `dueDate` timestamp,
  `paidDate` timestamp,
  `paymentMethod` varchar(50),
  `notes` text,
  `pdfUrl` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
  CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);

CREATE TABLE `invoiceItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `invoiceId` int NOT NULL,
  `feeId` int NOT NULL,
  `value` decimal(12, 2) NOT NULL,
  `currency` enum('USD', 'BRL') NOT NULL DEFAULT 'BRL',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);

CREATE TABLE `receipts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `receiptNumber` varchar(100) NOT NULL,
  `invoiceId` int NOT NULL,
  `operationId` int NOT NULL,
  `clientId` int NOT NULL,
  `amount` decimal(12, 2) NOT NULL,
  `paymentDate` timestamp NOT NULL,
  `paymentMethod` varchar(50),
  `notes` text,
  `pdfUrl` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `receipts_id` PRIMARY KEY(`id`),
  CONSTRAINT `receipts_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
