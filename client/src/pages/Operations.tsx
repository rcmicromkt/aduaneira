import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function OperationsPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    referenceNumber: "",
    clientId: "",
    supplierId: "",
    status: "pending" as const,
    notes: "",
  });

  const queryClient = useQueryClient();
  const { data: operations, isLoading } = trpc.operations.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const createMutation = trpc.operations.create.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      toast.success("Operação criada com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        toast.error(error.message);
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    },
  });

  const updateMutation = trpc.operations.update.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      toast.success("Operação atualizada com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.operations.delete.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      toast.success("Operação deletada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      referenceNumber: "",
      clientId: "",
      supplierId: "",
      status: "pending",
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          ...formData,
          clientId: parseInt(formData.clientId),
          supplierId: parseInt(formData.supplierId),
        } as any,
      });
    } else {
      createMutation.mutate({
        ...formData,
        clientId: parseInt(formData.clientId),
        supplierId: parseInt(formData.supplierId),
      } as any);
    }
  };

  const handleEdit = (operation: any) => {
    setFormData({
      referenceNumber: operation.referenceNumber,
      clientId: operation.clientId.toString(),
      supplierId: operation.supplierId.toString(),
      status: operation.status,
      notes: operation.notes || "",
    });
    setEditingId(operation.id);
    setOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      in_progress: "Em Progresso",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-900">Operações de Desembaraço</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Operação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingId ? "Editar Operação" : "Nova Operação"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-900">Número de Referência *</Label>
                  <Input
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Cliente *</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label className="text-emerald-900">Fornecedor *</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-emerald-900">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-emerald-900">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                {editingId ? "Atualizar" : "Criar"} Operação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Lista de Operações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : operations?.length === 0 ? (
            <div className="text-center py-8 text-emerald-600">Nenhuma operação cadastrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-200">
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Referência</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Cliente</th>
                    <th className="text-right py-3 px-4 font-semibold text-emerald-900">Custo Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-emerald-900">Venda Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-emerald-900">Lucro</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {operations?.map((operation) => {
                    const client = clients?.find(c => c.id === operation.clientId);
                    return (
                      <tr key={operation.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                        <td className="py-3 px-4 font-medium">{operation.referenceNumber}</td>
                        <td className="py-3 px-4">{client?.consignee || "-"}</td>
                        <td className="py-3 px-4 text-right">R$ {parseFloat(operation.totalCost || "0").toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">R$ {parseFloat(operation.totalSelling || "0").toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">R$ {parseFloat(operation.totalProfit || "0").toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(operation.status)}`}>
                            {getStatusLabel(operation.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(operation)}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate({ id: operation.id })}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
