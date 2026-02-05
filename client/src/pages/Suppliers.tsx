import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatCNPJ, maskCNPJ } from "@/lib/utils";

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    serviceType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bankAccount: "",
    bankAgency: "",
    bankName: "",
    notes: "",
  });

  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      toast.success("Fornecedor criado com sucesso!");
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

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      toast.success("Fornecedor atualizado com sucesso!");
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

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      toast.success("Fornecedor deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      cnpj: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      serviceType: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      bankAccount: "",
      bankAgency: "",
      bankName: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: formData as any,
      });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleEdit = (supplier: any) => {
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj,
      contactName: supplier.contactName || "",
      contactEmail: supplier.contactEmail || "",
      contactPhone: supplier.contactPhone || "",
      serviceType: supplier.serviceType,
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zipCode: supplier.zipCode || "",
      bankAccount: supplier.bankAccount || "",
      bankAgency: supplier.bankAgency || "",
      bankName: supplier.bankName || "",
      notes: supplier.notes || "",
    });
    setEditingId(supplier.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-900">Fornecedores</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-900">Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">CNPJ *</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Tipo de Serviço *</Label>
                  <Input
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="Ex: Frete, Terminal, Seguro"
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Nome do Contato</Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Email</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Telefone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">CEP</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Banco</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Conta Bancária</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Agência</Label>
                  <Input
                    value={formData.bankAgency}
                    onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-emerald-900">Endereço</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-emerald-900">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                {editingId ? "Atualizar" : "Criar"} Fornecedor
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : suppliers?.length === 0 ? (
            <div className="text-center py-8 text-emerald-600">Nenhum fornecedor cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-200">
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">CNPJ</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Tipo de Serviço</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Contato</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers?.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                      <td className="py-3 px-4 font-medium">{supplier.name}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatCNPJ(supplier.cnpj)}</td>
                      <td className="py-3 px-4">{supplier.serviceType}</td>
                      <td className="py-3 px-4">{supplier.contactEmail || supplier.contactPhone || "-"}</td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(supplier)}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ id: supplier.id })}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
