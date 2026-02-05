import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  longtext
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes - Empresas ou pessoas que solicitam desembaraço aduaneiro
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  shipper: varchar("shipper", { length: 255 }).notNull(),
  consignee: varchar("consignee", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull().unique(),
  portOrigin: varchar("portOrigin", { length: 100 }),
  portDestination: varchar("portDestination", { length: 100 }),
  weight: decimal("weight", { precision: 12, scale: 2 }),
  notify: varchar("notify", { length: 255 }),
  bl: varchar("bl", { length: 100 }).notNull(),
  blDate: timestamp("blDate").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  referenceNumber: varchar("referenceNumber", { length: 100 }).notNull().unique(),
  birthDate: timestamp("birthDate"),
  freightType: mysqlEnum("freightType", ["FOB", "EXW"]).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Helper to format port route
export function formatPortRoute(origin?: string | null, destination?: string | null): string {
  if (!origin && !destination) return "";
  if (origin && destination) return `${origin} / ${destination}`;
  return origin || destination || "";
}

/**
 * Fornecedores - Empresas que prestam serviços de desembaraço
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull().unique(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankAgency: varchar("bankAgency", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Taxas - Apenas nome da taxa, sem valor (valor é definido na fatura)
 */
export const fees = mysqlTable("fees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ocean Freight, Handling, TRS, etc
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fee = typeof fees.$inferSelect;
export type InsertFee = typeof fees.$inferInsert;

/**
 * Operações de Desembaraço - Operações principais do sistema
 */
export const operations = mysqlTable("operations", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 100 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  supplierId: int("supplierId").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).default("0").notNull(),
  totalSelling: decimal("totalSelling", { precision: 12, scale: 2 }).default("0").notNull(),
  totalProfit: decimal("totalProfit", { precision: 12, scale: 2 }).default("0").notNull(),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).default("0").notNull(),
  iofValue: decimal("iofValue", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = typeof operations.$inferInsert;

/**
 * Faturas - Documentos de cobrança
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  operationId: int("operationId").notNull(),
  clientId: int("clientId").notNull(),
  dollarValue: decimal("dollarValue", { precision: 12, scale: 4 }).notNull(), // Valor do dólar para esta fatura
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  iofAmount: decimal("iofAmount", { precision: 12, scale: 2 }).default("0"),
  finalAmount: decimal("finalAmount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  notes: text("notes"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Itens da Fatura - Taxas adicionadas à fatura com valores específicos
 */
export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  feeId: int("feeId").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(), // Valor de venda (cobrado do cliente)
  currency: mysqlEnum("currency", ["USD", "BRL"]).default("BRL").notNull(), // Moeda de venda
  costValue: decimal("costValue", { precision: 12, scale: 2 }).default("0").notNull(), // Valor de custo (pago ao fornecedor)
  costCurrency: mysqlEnum("costCurrency", ["USD", "BRL"]).default("BRL").notNull(), // Moeda de custo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * Recibos - Comprovantes de pagamento
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 100 }).notNull().unique(),
  invoiceId: int("invoiceId").notNull(),
  operationId: int("operationId").notNull(),
  clientId: int("clientId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  notes: text("notes"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;
