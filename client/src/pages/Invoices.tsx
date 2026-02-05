import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, FileText, X, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const invoiceItemSchema = z.object({
  feeId: z.string().min(1, "Selecione uma taxa"),
  value: z.string().min(1, "Informe o valor"),
  currency: z.enum(["USD", "BRL"]),
  costValue: z.string().optional().default("0"),
  costCurrency: z.enum(["USD", "BRL"]).optional().default("BRL"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Número da fatura é obrigatório"),
  operationId: z.string().min(1, "Selecione uma operação"),
  clientId: z.string().min(1, "Selecione um cliente"),
  dollarValue: z.string().min(1, "Informe o valor do dólar"),
  iofAmount: z.string().default("0"),
  dueDate: z.string().default(""),
  paymentMethod: z.string().default(""),
  notes: z.string().default(""),
  items: z.array(invoiceItemSchema).min(1, "Adicione pelo menos uma taxa"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

const defaultFormValues: InvoiceFormData = {
  invoiceNumber: "",
  operationId: "",
  clientId: "",
  dollarValue: "",
  iofAmount: "0",
  dueDate: "",
  paymentMethod: "",
  notes: "",
  items: [],
};

export default function InvoicesPage() {
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const formData = watch();
  const invoiceItems = formData.items || [];

  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = trpc.invoices.list.useQuery();
  const { data: operations } = trpc.operations.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: fees } = trpc.fees.list.useQuery();

  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success("Fatura criada com sucesso!");
      setOpen(false);
      reset(defaultFormValues);
    },
    onError: (error) => {
      if (error.message.includes("número")) {
        setError("invoiceNumber", { message: error.message });
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    },
  });

  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success("Fatura atualizada com sucesso!");
      setOpen(false);
      reset(defaultFormValues);
    },
    onError: (error) => {
      if (error.message.includes("número")) {
        setError("invoiceNumber", { message: error.message });
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    },
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success("Fatura deletada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const markAsPaidMutation = trpc.invoices.markAsPaid.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success("Fatura marcada como paga!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleGeneratePDF = async (invoice: any) => {
    setIsGenerating(invoice.id);
    try {
      const items = await utils.invoices.getItems.fetch({ invoiceId: invoice.id });
      const client = clients?.find(c => c.id === invoice.clientId);
      const operation = operations?.find(o => o.id === invoice.operationId);

      generateInvoicePDF(invoice, client, operation, items, fees || []);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(null);
    }
  };

  const calculateTotal = () => {
    const dollarValue = parseFloat(formData.dollarValue) || 1;
    let selling = 0;
    let cost = 0;

    invoiceItems.forEach((item) => {
      const v = parseFloat(item.value) || 0;
      const c = parseFloat(item.costValue) || 0;

      const itemSelling = item.currency === "USD" ? v * dollarValue : v;
      const itemCost = item.costCurrency === "USD" ? c * dollarValue : c;

      selling += itemSelling;
      cost += itemCost;
    });

    return {
      selling: Math.round(selling * 100) / 100,
      cost: Math.round(cost * 100) / 100
    };
  };

  const onFormSubmit = (data: any) => {
    const { selling: totalAmount } = calculateTotal();

    const payload = {
      ...data,
      operationId: parseInt(data.operationId),
      clientId: parseInt(data.clientId),
      dollarValue: data.dollarValue,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      totalAmount: totalAmount.toString(),
      iofAmount: parseFloat(data.iofAmount || "0").toString(),
      finalAmount: (totalAmount + (parseFloat(data.iofAmount) || 0)).toString(),
      items: data.items.map((item: any) => ({
        feeId: parseInt(item.feeId),
        value: item.value,
        currency: item.currency,
        costValue: item.costValue || "0",
        costCurrency: item.costCurrency
      })),
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: payload as any,
      });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const handleEdit = async (invoice: any) => {
    reset({
      invoiceNumber: invoice.invoiceNumber,
      operationId: invoice.operationId.toString(),
      clientId: invoice.clientId.toString(),
      dollarValue: invoice.dollarValue.toString(),
      iofAmount: invoice.iofAmount?.toString() || "0",
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
      paymentMethod: invoice.paymentMethod || "",
      notes: invoice.notes || "",
      items: [],
    });
    setEditingId(invoice.id);

    try {
      const items = await utils.invoices.getItems.fetch({ invoiceId: invoice.id });
      setValue("items", items.map((item: any) => ({
        feeId: item.feeId.toString(),
        value: item.value.toString(),
        currency: item.currency,
        costValue: item.costValue?.toString() || "0",
        costCurrency: item.costCurrency || "BRL",
      })));
    } catch (error) {
      console.error("Failed to load invoice items:", error);
      toast.error("Erro ao carregar itens da fatura");
    }

    setOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Paga",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-900">Faturas</h1>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingId(null);
            reset(defaultFormValues);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              + Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingId ? "Editar Fatura" : "Nova Fatura"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber" className={`font-semibold ${errors.invoiceNumber ? 'text-red-500' : 'text-emerald-900'}`}>
                    Número da Fatura *
                  </Label>
                  <Input
                    id="invoiceNumber"
                    {...register("invoiceNumber")}
                    placeholder="Ex: NF-001"
                    className={`border-emerald-200 ${errors.invoiceNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.invoiceNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="operationId" className={`font-semibold ${errors.operationId ? 'text-red-500' : 'text-emerald-900'}`}>
                    Operação *
                  </Label>
                  <Select
                    value={formData.operationId}
                    onValueChange={(value) => {
                      setValue("operationId", value);
                      const selectedOp = operations?.find(op => op.id.toString() === value);
                      if (selectedOp) {
                        setValue("clientId", selectedOp.clientId.toString());
                      }
                    }}
                  >
                    <SelectTrigger className={`border-emerald-200 ${errors.operationId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecione uma operação" />
                    </SelectTrigger>
                    <SelectContent>
                      {operations?.map((op) => (
                        <SelectItem key={op.id} value={op.id.toString()}>
                          {op.referenceNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.operationId && (
                    <p className="text-red-500 text-xs mt-1">{errors.operationId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clientId" className={`font-semibold ${errors.clientId ? 'text-red-500' : 'text-emerald-900'}`}>
                    Cliente *
                  </Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setValue("clientId", value)}
                  >
                    <SelectTrigger className={`border-emerald-200 ${errors.clientId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.consignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dollarValue" className={`font-semibold ${errors.dollarValue ? 'text-red-500' : 'text-emerald-900'}`}>
                    Valor do Dólar (USD/BRL) *
                  </Label>
                  <Input
                    id="dollarValue"
                    type="number"
                    step="0.0001"
                    {...register("dollarValue")}
                    placeholder="Ex: 5.2534"
                    className={`border-emerald-200 ${errors.dollarValue ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.dollarValue && (
                    <p className="text-red-500 text-xs mt-1">{errors.dollarValue.message}</p>
                  )}
                </div>
              </div>

              {/* Seção de Taxas */}
              <div className="border-t border-emerald-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-semibold ${errors.items ? 'text-red-500' : 'text-emerald-900'}`}>Taxas na Fatura</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => append({ feeId: "", value: "", currency: "BRL", costValue: "0", costCurrency: "BRL" })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Taxa
                  </Button>
                </div>
                {errors.items && (
                  <p className="text-red-500 text-xs mb-2">{errors.items.root?.message || errors.items.message}</p>
                )}

                {fields.length > 0 ? (
                  <div className="space-y-2 overflow-x-auto">
                    {fields.map((field, index) => {
                      const dollarValue = parseFloat(formData.dollarValue) || 1;
                      const itemValue = parseFloat(invoiceItems[index]?.value) || 0;
                      const costValue = parseFloat(invoiceItems[index]?.costValue) || 0;
                      const totalSelling = invoiceItems[index]?.currency === "USD" ? itemValue * dollarValue : itemValue;
                      const totalCost = invoiceItems[index]?.costCurrency === "USD" ? costValue * dollarValue : costValue;

                      return (
                        <div key={field.id} className="flex gap-1 items-end bg-emerald-50 p-2 rounded border border-emerald-200 min-w-max">
                          <div className="min-w-[140px]">
                            <Label className={`text-xs font-semibold ${errors.items?.[index]?.feeId ? 'text-red-500' : 'text-emerald-900'}`}>Taxa</Label>
                            <Select
                              value={invoiceItems[index]?.feeId}
                              onValueChange={(value) => setValue(`items.${index}.feeId`, value)}
                            >
                              <SelectTrigger className={`border-emerald-200 text-xs h-8 ${errors.items?.[index]?.feeId ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Taxa" />
                              </SelectTrigger>
                              <SelectContent>
                                {fees?.map((fee) => (
                                  <SelectItem key={fee.id} value={fee.id.toString()}>
                                    {fee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="bg-emerald-100/50 p-1 rounded border border-emerald-200 flex gap-1">
                            <div className="w-20">
                              <Label className={`text-[10px] font-semibold ${errors.items?.[index]?.value ? 'text-red-500' : 'text-emerald-800'}`}>Venda (R$/$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`items.${index}.value`)}
                                className={`border-emerald-200 text-xs h-7 ${errors.items?.[index]?.value ? 'border-red-500' : ''}`}
                              />
                            </div>
                            <div className="w-14">
                              <Label className="text-[10px] text-emerald-800 font-semibold">Moeda</Label>
                              <Select
                                value={invoiceItems[index]?.currency}
                                onValueChange={(value) => setValue(`items.${index}.currency`, value as any)}
                              >
                                <SelectTrigger className="border-emerald-200 text-xs h-7">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BRL">R$</SelectItem>
                                  <SelectItem value="USD">$</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="bg-amber-100/50 p-1 rounded border border-amber-200 flex gap-1">
                            <div className="w-20">
                              <Label className="text-[10px] text-amber-800 font-semibold">Custo (R$/$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`items.${index}.costValue`)}
                                className="border-amber-200 text-xs h-7"
                              />
                            </div>
                            <div className="w-14">
                              <Label className="text-[10px] text-amber-800 font-semibold">Moeda</Label>
                              <Select
                                value={invoiceItems[index]?.costCurrency}
                                onValueChange={(value) => setValue(`items.${index}.costCurrency`, value as any)}
                              >
                                <SelectTrigger className="border-amber-200 text-xs h-7">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BRL">R$</SelectItem>
                                  <SelectItem value="USD">$</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="w-32">
                            <Label className="text-xs text-emerald-900 font-semibold text-center block">Subtotais (R$)</Label>
                            <div className="grid grid-cols-2 gap-1">
                              <div className="bg-white border border-emerald-200 rounded px-1 py-1 text-[10px] font-semibold text-emerald-900 text-center">
                                V: {totalSelling.toFixed(2)}
                              </div>
                              <div className="bg-white border border-amber-200 rounded px-1 py-1 text-[10px] font-semibold text-amber-900 text-center">
                                C: {totalCost.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => remove(index)}
                            className="border-red-200 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-emerald-600 text-sm">
                    Clique em "Adicionar Taxa" para começar
                  </div>
                )}
              </div>

              {/* Totais */}
              <div className="bg-emerald-50 p-4 rounded border border-emerald-200 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-emerald-900 text-sm">Total Venda:</span>
                    <span className="text-emerald-900 text-sm font-bold">R$ {calculateTotal().selling.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-900 text-sm">Total Custo:</span>
                    <span className="text-amber-900 text-sm font-bold">R$ {calculateTotal().cost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-emerald-200 pt-2">
                  <Label htmlFor="iofAmount" className="font-semibold text-emerald-900">
                    IOF (Soma ao total final):
                  </Label>
                  <Input
                    id="iofAmount"
                    type="number"
                    step="0.01"
                    {...register("iofAmount")}
                    placeholder="0.00"
                    className="w-24 border-emerald-200"
                  />
                </div>

                <div className="border-t border-emerald-200 pt-2 flex justify-between bg-emerald-100 p-2 rounded">
                  <span className="font-bold text-emerald-900">Total Final (Venda + IOF):</span>
                  <span className="font-bold text-emerald-900 text-lg">
                    R$ {(calculateTotal().selling + (parseFloat(formData.iofAmount) || 0)).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700 font-semibold">Lucro Estimado nesta Fatura:</span>
                  <span className={`${calculateTotal().selling - calculateTotal().cost >= 0 ? 'text-emerald-700' : 'text-red-600'} font-bold`}>
                    R$ {(calculateTotal().selling - calculateTotal().cost).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate" className="text-emerald-900 font-semibold">
                    Data de Vencimento
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    className="border-emerald-200"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod" className="text-emerald-900 font-semibold">
                    Método de Pagamento
                  </Label>
                  <Input
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    placeholder="Ex: Transferência, Boleto"
                    className="border-emerald-200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-emerald-900 font-semibold">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Notas adicionais"
                  className="border-emerald-200"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    reset(defaultFormValues);
                    setEditingId(null);
                  }}
                  className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Atualizar" : "Criar"} Fatura
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
          <CardTitle className="text-emerald-900">Lista de Faturas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-emerald-600">Carregando...</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50 border-b border-emerald-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Número</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Operação</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Cliente</th>
                    <th className="text-right py-3 px-4 font-semibold text-emerald-900">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                      <td className="py-3 px-4 font-medium text-emerald-900">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4 text-emerald-700">
                        {operations?.find((op) => op.id === invoice.operationId)?.referenceNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-emerald-700">
                        {clients?.find((c) => c.id === invoice.clientId)?.consignee || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-900">
                        R$ {parseFloat(invoice.finalAmount || "0").toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(invoice)}
                          disabled={isGenerating === invoice.id}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Gerar PDF"
                        >
                          {isGenerating === invoice.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(invoice)}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ id: invoice.id })}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-emerald-600">
              Nenhuma fatura cadastrada. Clique em "+ Nova Fatura" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
