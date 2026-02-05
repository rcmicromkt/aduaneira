import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  clients,
  suppliers,
  fees,
  operations,
  invoices,
  invoiceItems,
  receipts,
  type Client,
  type Supplier,
  type Fee,
  type Operation,
  type Invoice,
  type InvoiceItem,
  type Receipt
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_pool) {
        _pool = mysql.createPool({
          uri: process.env.DATABASE_URL,
          waitForConnections: true,
          connectionLimit: 10,
          maxIdle: 10,
          idleTimeout: 60000,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
          ssl: {
            rejectUnauthorized: false
          }
        });
      }
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Record<string, any> = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    // Try a simpler way that is very robust
    await db.insert(users).values(values as any).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        role: values.role ?? undefined
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    // Log the full error to help debugging
    if (error instanceof Error) {
      (error as any).details = "Extended info for debugging";
    }
    throw error;
  }
}


export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== CLIENTS =====
export async function createClient(data: Omit<typeof clients.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data);
  return result;
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listClients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function updateClient(id: number, data: Partial<typeof clients.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(clients).where(eq(clients.id, id));
}

export async function getClientByCnpj(cnpj: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.cnpj, cnpj)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getClientByReference(referenceNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.referenceNumber, referenceNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== SUPPLIERS =====
export async function createSupplier(data: Omit<typeof suppliers.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(suppliers).values(data);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listSuppliers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(desc(suppliers.createdAt));
}

export async function updateSupplier(id: number, data: Partial<typeof suppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(suppliers).where(eq(suppliers.id, id));
}

export async function getSupplierByCnpj(cnpj: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(suppliers).where(eq(suppliers.cnpj, cnpj)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== FEES =====
export async function createFee(data: Omit<typeof fees.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(fees).values(data);
}

export async function getFeeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(fees).where(eq(fees.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listFees() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(fees).where(eq(fees.isActive, true)).orderBy(desc(fees.createdAt));
}

export async function updateFee(id: number, data: Partial<typeof fees.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(fees).set(data).where(eq(fees.id, id));
}

export async function deleteFee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(fees).where(eq(fees.id, id));
}

// ===== OPERATIONS =====
export async function createOperation(data: Omit<typeof operations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(operations).values(data);
}

export async function getOperationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(operations).where(eq(operations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listOperations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(operations).orderBy(desc(operations.createdAt));
}

export async function listOperationsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(operations)
    .where(eq(operations.clientId, clientId))
    .orderBy(desc(operations.createdAt));
}

export async function updateOperation(id: number, data: Partial<typeof operations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(operations).set(data).where(eq(operations.id, id));
}

export async function deleteOperation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(operations).where(eq(operations.id, id));
}

export async function getOperationByReference(referenceNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(operations).where(eq(operations.referenceNumber, referenceNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== INVOICE ITEMS =====
export async function addItemToInvoice(data: Omit<typeof invoiceItems.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(invoiceItems).values(data);
}

export async function getInvoiceItems(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

export async function recalculateOperationTotals(operationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const op = await getOperationById(operationId);
  if (!op) return;

  let totalSelling = 0;
  let totalCost = 0;

  // Only calculate totals if the operation is completed
  if (op.status === "completed") {
    const invoicesList = await db.select().from(invoices).where(eq(invoices.operationId, operationId));

    for (const inv of invoicesList) {
      totalSelling += parseFloat(inv.finalAmount || "0");

      const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
      const dollarValue = parseFloat(inv.dollarValue || "1");

      for (const item of items) {
        const itemCost = parseFloat(item.costValue || "0");
        if (item.costCurrency === "USD") {
          totalCost += itemCost * dollarValue;
        } else {
          totalCost += itemCost;
        }
      }
    }
  }

  const totalProfit = totalSelling - totalCost;
  const profitMargin = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

  return db.update(operations)
    .set({
      totalSelling: totalSelling.toString(),
      totalCost: totalCost.toString(),
      totalProfit: totalProfit.toString(),
      profitMargin: profitMargin.toFixed(2),
    })
    .where(eq(operations.id, operationId));
}

export async function removeInvoiceItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(invoiceItems).where(eq(invoiceItems.id, id));
}

// ===== INVOICES =====
export async function createInvoice(data: Omit<typeof invoices.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(invoices).values(data);
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listInvoices() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function listInvoicesByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.createdAt));
}

export async function listInvoicesByOperation(operationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(invoices)
    .where(eq(invoices.operationId, operationId))
    .orderBy(desc(invoices.createdAt));
}

export async function updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function updateInvoicesStatusByOperation(operationId: number, status: "pending" | "paid" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(invoices)
    .set({ status })
    .where(eq(invoices.operationId, operationId));
}

export async function deleteInvoice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(invoices).where(eq(invoices.id, id));
}

// ===== RECEIPTS =====
export async function createReceipt(data: Omit<typeof receipts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(receipts).values(data);
}

export async function getReceiptById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listReceipts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(receipts).orderBy(desc(receipts.createdAt));
}

export async function listReceiptsByInvoice(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(receipts)
    .where(eq(receipts.invoiceId, invoiceId))
    .orderBy(desc(receipts.createdAt));
}

export async function updateReceipt(id: number, data: Partial<typeof receipts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(receipts).set(data).where(eq(receipts.id, id));
}

export async function deleteReceipt(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(receipts).where(eq(receipts.id, id));
}
