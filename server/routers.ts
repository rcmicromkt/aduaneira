import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, TRPCError } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

// ===== VALIDATION SCHEMAS =====
const clientSchema = z.object({
  shipper: z.string().min(1, "O remetente é obrigatório"),
  consignee: z.string().min(1, "O consignatário é obrigatório"),
  cnpj: z
    .string()
    .min(1, "O CNPJ é obrigatório")
    .transform(val => val.replace(/\D/g, ""))
    .refine(val => val.length === 14, "O CNPJ deve ter 14 dígitos"),
  portOrigin: z.string().min(1, "O porto de origem é obrigatório"),
  portDestination: z.string().min(1, "O porto de destino é obrigatório"),
  weight: z.string().optional(),
  notify: z.string().optional(),
  bl: z.string().min(1, "O BL é obrigatório"),
  blDate: z.date(),
  invoiceNumber: z.string().optional(),
  referenceNumber: z.string().min(1, "O número de referência é obrigatório"),
  birthDate: z.date().optional(),
  freightType: z.enum(["FOB", "EXW"]),
  contactName: z.string().optional(),
  contactEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

const supplierSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  cnpj: z
    .string()
    .min(1, "O CNPJ é obrigatório")
    .transform(val => val.replace(/\D/g, ""))
    .refine(val => val.length === 14, "O CNPJ deve ter 14 dígitos"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  serviceType: z.string().min(1, "O tipo de serviço é obrigatório"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAgency: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

const feeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const operationSchema = z.object({
  referenceNumber: z.string().min(1),
  clientId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  notes: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  operationId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  dollarValue: z.string(),
  totalAmount: z.string(),
  iofAmount: z.string().optional(),
  dueDate: z.date().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  finalAmount: z.string().optional(),
  items: z.array(z.object({
    feeId: z.number().int().positive(),
    value: z.string(),
    currency: z.enum(["USD", "BRL"]).default("BRL"),
    costValue: z.string().optional().default("0"),
    costCurrency: z.enum(["USD", "BRL"]).default("BRL"),
  })).optional(),
});

const invoiceItemSchema = z.object({
  invoiceId: z.number().int().positive(),
  feeId: z.number().int().positive(),
  value: z.string(),
  currency: z.enum(["USD", "BRL"]).default("BRL"),
  costValue: z.string().optional().default("0"),
  costCurrency: z.enum(["USD", "BRL"]).default("BRL"),
});

const receiptSchema = z.object({
  receiptNumber: z.string().min(1),
  invoiceId: z.number().int().positive(),
  operationId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  amount: z.string(),
  paymentDate: z.date(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== CLIENTS =====
  clients: router({
    create: protectedProcedure
      .input(clientSchema)
      .mutation(async ({ input }) => {
        // Check CNPJ
        const existingCnpj = await db.getClientByCnpj(input.cnpj);
        if (existingCnpj) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um cliente cadastrado com este CNPJ.",
          });
        }

        // Check Reference Number
        const existingRef = await db.getClientByReference(input.referenceNumber);
        if (existingRef) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Já existe um cliente cadastrado com o número de referência "${input.referenceNumber}".`,
          });
        }

        // Normalize empty strings to null for optional database fields
        const normalizedInput = {
          ...input,
          weight: input.weight === "" ? null : input.weight,
          notify: input.notify === "" ? null : input.notify,
          invoiceNumber: input.invoiceNumber === "" ? null : input.invoiceNumber,
          contactName: input.contactName === "" ? null : input.contactName,
          contactEmail: input.contactEmail === "" ? null : input.contactEmail,
          contactPhone: input.contactPhone === "" ? null : input.contactPhone,
          address: input.address === "" ? null : input.address,
          city: input.city === "" ? null : input.city,
          state: input.state === "" ? null : input.state,
          zipCode: input.zipCode === "" ? null : input.zipCode,
          notes: input.notes === "" ? null : input.notes,
        };

        return db.createClient(normalizedInput as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listClients();
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        data: clientSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        if (input.data.cnpj) {
          const existing = await db.getClientByCnpj(input.data.cnpj);
          if (existing && existing.id !== input.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Já existe um cliente cadastrado com este CNPJ.",
            });
          }
        }
        return db.updateClient(input.id, input.data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.deleteClient(input.id);
      }),
  }),

  // ===== SUPPLIERS =====
  suppliers: router({
    create: protectedProcedure
      .input(supplierSchema)
      .mutation(async ({ input }) => {
        const existing = await db.getSupplierByCnpj(input.cnpj);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um fornecedor cadastrado com este CNPJ.",
          });
        }
        return db.createSupplier(input as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getSupplierById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listSuppliers();
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        data: supplierSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        if (input.data.cnpj) {
          const existing = await db.getSupplierByCnpj(input.data.cnpj);
          if (existing && existing.id !== input.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Já existe um fornecedor cadastrado com este CNPJ.",
            });
          }
        }
        return db.updateSupplier(input.id, input.data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.deleteSupplier(input.id);
      }),
  }),

  // ===== FEES =====
  fees: router({
    create: protectedProcedure
      .input(feeSchema)
      .mutation(async ({ input }) => {
        return db.createFee(input as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getFeeById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listFees();
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        data: feeSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        return db.updateFee(input.id, input.data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.deleteFee(input.id);
      }),
  }),

  // ===== OPERATIONS =====
  operations: router({
    create: protectedProcedure
      .input(operationSchema)
      .mutation(async ({ input }) => {
        // Check for duplicate reference
        const existing = await db.getOperationByReference(input.referenceNumber);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Já existe uma operação com o número de referência "${input.referenceNumber}".`,
          });
        }
        const result = await db.createOperation(input as any);

        // Notify owner about new operation
        const client = await db.getClientById(input.clientId);
        if (client) {
          await notifyOwner({
            title: "Nova Operação de Desembaraço",
            content: `Uma nova operação foi criada: ${input.referenceNumber} para o cliente ${client.consignee}`,
          });
        }

        return result;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getOperationById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listOperations();
      }),

    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.listOperationsByClient(input.clientId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        data: operationSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        const operation = await db.getOperationById(input.id);
        const result = await db.updateOperation(input.id, input.data as any);

        // Notify owner about status change
        if (input.data.status && operation && input.data.status !== operation.status) {
          const client = await db.getClientById(operation.clientId);
          const statusLabels: Record<string, string> = {
            pending: "Pendente",
            in_progress: "Em Progresso",
            completed: "Concluída",
            cancelled: "Cancelada",
          };

          await notifyOwner({
            title: "Status da Operação Atualizado",
            content: `A operação ${operation.referenceNumber} foi atualizada para: ${statusLabels[input.data.status]}`,
          });
        }

        // Automatic Invoice Integration: Sync invoice status with operation status
        if (input.data.status === "completed") {
          await db.updateInvoicesStatusByOperation(input.id, "paid");
        } else if (input.data.status === "pending" || input.data.status === "in_progress") {
          await db.updateInvoicesStatusByOperation(input.id, "pending");
        }

        // Ensure totals are recalculated to reflect the requirement "valor total precisa voltar a ficar 0,00"
        await db.recalculateOperationTotals(input.id);

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.deleteOperation(input.id);
      }),

    addFee: protectedProcedure
      .input(z.object({
        operationId: z.number().int().positive(),
        feeId: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        // Fees are now added to invoices, not operations
        return { success: true };
      }),
  }),

  // ===== INVOICES =====
  invoices: router({
    create: protectedProcedure
      .input(invoiceSchema)
      .mutation(async ({ input }) => {
        const { items, ...invoiceData } = input;

        const existing = await db.getInvoiceByNumber(invoiceData.invoiceNumber);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Já existe uma fatura com o número "${invoiceData.invoiceNumber}".`,
          });
        }

        const totalAmount = parseFloat(invoiceData.totalAmount);
        const iofAmount = invoiceData.iofAmount ? parseFloat(invoiceData.iofAmount) : 0;
        const finalAmount = totalAmount + iofAmount;

        const result = await db.createInvoice({
          ...invoiceData,
          totalAmount: totalAmount.toString(),
          iofAmount: iofAmount.toString(),
          finalAmount: finalAmount.toString(),
        } as any);

        const invoiceId = (result as any)[0].insertId;

        if (items && items.length > 0) {
          for (const item of items) {
            await db.addItemToInvoice({
              ...item,
              invoiceId,
              value: parseFloat(item.value).toString(),
              costValue: parseFloat(item.costValue || "0").toString(),
            } as any);
          }
        }

        await db.recalculateOperationTotals(invoiceData.operationId);

        return result;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getInvoiceById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listInvoices();
      }),

    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.listInvoicesByClient(input.clientId);
      }),

    listByOperation: protectedProcedure
      .input(z.object({ operationId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.listInvoicesByOperation(input.operationId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        data: invoiceSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        const { items, ...data } = input.id ? { ...input.data } : { items: [], ...input.data }; // Safe destructure

        if (data.invoiceNumber) {
          const existing = await db.getInvoiceByNumber(data.invoiceNumber);
          if (existing && existing.id !== input.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Já existe uma fatura com o número "${data.invoiceNumber}".`,
            });
          }
        }

        if (data.totalAmount) data.totalAmount = parseFloat(data.totalAmount).toString() as any;
        if (data.iofAmount) data.iofAmount = parseFloat(data.iofAmount).toString() as any;

        // Recalculate finalAmount on server to be safe
        if (data.totalAmount) {
          const total = parseFloat(data.totalAmount as any);
          const iof = parseFloat(data.iofAmount as any || "0");
          data.finalAmount = (total + iof).toString() as any;
        }

        const result = await db.updateInvoice(input.id, data as any);

        if (items) {
          // Sync items: simpler to Delete all and re-add for now, or update logic
          const existingItems = await db.getInvoiceItems(input.id);
          for (const item of existingItems) {
            await db.removeInvoiceItem(item.id);
          }

          for (const item of items) {
            await db.addItemToInvoice({
              ...item,
              invoiceId: input.id,
              value: parseFloat(item.value).toString(),
              costValue: parseFloat(item.costValue || "0").toString(),
            } as any);
          }
        }

        const updatedInvoice = await db.getInvoiceById(input.id);
        if (updatedInvoice) {
          await db.recalculateOperationTotals(updatedInvoice.operationId);
        }

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        const result = await db.deleteInvoice(input.id);
        if (invoice) {
          await db.recalculateOperationTotals(invoice.operationId);
        }
        return result;
      }),

    addItem: protectedProcedure
      .input(invoiceItemSchema)
      .mutation(async ({ input }) => {
        return db.addItemToInvoice({
          invoiceId: input.invoiceId,
          feeId: input.feeId,
          value: parseFloat(input.value).toString(),
          currency: input.currency,
          costValue: parseFloat(input.costValue || "0").toString(),
          costCurrency: input.costCurrency,
        } as any);
      }),

    getItems: protectedProcedure
      .input(z.object({ invoiceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getInvoiceItems(input.invoiceId);
      }),

    removeItem: protectedProcedure
      .input(z.object({ itemId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.removeInvoiceItem(input.itemId);
      }),

    markAsPaid: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        paymentDate: z.date(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateInvoice(input.id, {
          status: "paid",
          paidDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
        } as any);
      }),
  }),

  // ===== RECEIPTS =====
  receipts: router({
    create: protectedProcedure
      .input(receiptSchema)
      .mutation(async ({ input }) => {
        return db.createReceipt({
          ...input,
          amount: parseFloat(input.amount).toString(),
        } as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getReceiptById(input.id);
      }),

    list: protectedProcedure
      .query(async () => {
        return db.listReceipts();
      }),

    listByInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.listReceiptsByInvoice(input.invoiceId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return db.deleteReceipt(input.id);
      }),
  }),

  // ===== PROFIT & REPORTS =====
  reports: router({
    getProfitByOperation: protectedProcedure
      .input(z.object({ operationId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const operation = await db.getOperationById(input.operationId);
        return operation || null;
      }),

    getProfitByPeriod: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const operations = await db.listOperations();
        return operations.filter(op => {
          const createdAt = new Date(op.createdAt);
          return createdAt >= input.startDate && createdAt <= input.endDate;
        });
      }),

    getProfitByClient: protectedProcedure
      .input(z.object({ clientId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.listOperationsByClient(input.clientId);
      }),

    getSummary: protectedProcedure
      .query(async () => {
        const operations = await db.listOperations();
        const completedOps = operations.filter(op => op.status === "completed");

        let totalSelling = 0;
        let totalCost = 0;

        for (const op of completedOps) {
          const invoices = await db.listInvoicesByOperation(op.id);
          for (const inv of invoices) {
            totalSelling += parseFloat(inv.finalAmount || "0");

            const items = await db.getInvoiceItems(inv.id);
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

        return {
          totalOperations: operations.length,
          totalCost,
          totalSelling,
          totalProfit,
          averageMargin: totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
