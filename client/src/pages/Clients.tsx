import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatCNPJ, maskCNPJ } from "@/lib/utils";

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    shipper: "",
    consignee: "",
    cnpj: "",
    portOrigin: "",
    portDestination: "",
    weight: "",
    notify: "",
    bl: "",
    blDate: "",
    invoiceNumber: "",
    referenceNumber: "",
    birthDate: "",
    freightType: "FOB" as const,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const queryClient = useQueryClient();
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Cliente criado com sucesso!");
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

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Cliente atualizado com sucesso!");
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

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success("Cliente deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      shipper: "",
      consignee: "",
      cnpj: "",
      portOrigin: "",
      portDestination: "",
      weight: "",
      notify: "",
      bl: "",
      blDate: "",
      invoiceNumber: "",
      referenceNumber: "",
      birthDate: "",
      freightType: "FOB",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
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
          blDate: new Date(formData.blDate),
          birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        } as any,
      });
    } else {
      createMutation.mutate({
        ...formData,
        blDate: new Date(formData.blDate),
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      } as any);
    }
  };

  const handleEdit = (client: any) => {
    setFormData({
      shipper: client.shipper,
      consignee: client.consignee,
      cnpj: client.cnpj,
      portOrigin: client.portOrigin || "",
      portDestination: client.portDestination || "",
      weight: client.weight || "",
      notify: client.notify || "",
      bl: client.bl,
      blDate: client.blDate?.toISOString().split("T")[0] || "",
      invoiceNumber: client.invoiceNumber || "",
      referenceNumber: client.referenceNumber,
      birthDate: client.birthDate?.toISOString().split("T")[0] || "",
      freightType: client.freightType,
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || "",
      contactPhone: client.contactPhone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
      notes: client.notes || "",
    });
    setEditingId(client.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-900">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingId ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-900">Shipper *</Label>
                  <Input
                    value={formData.shipper}
                    onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Consignee *</Label>
                  <Input
                    value={formData.consignee}
                    onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
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
                  <Label className="text-emerald-900">Porto Origem *</Label>
                  <Input
                    value={formData.portOrigin}
                    onChange={(e) => setFormData({ ...formData, portOrigin: e.target.value })}
                    placeholder="Ex: Shekou"
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Porto Destino *</Label>
                  <Input
                    value={formData.portDestination}
                    onChange={(e) => setFormData({ ...formData, portDestination: e.target.value })}
                    placeholder="Ex: Santos"
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Peso</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">BL *</Label>
                  <Input
                    value={formData.bl}
                    onChange={(e) => setFormData({ ...formData, bl: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Data do BL *</Label>
                  <Input
                    type="date"
                    value={formData.blDate}
                    onChange={(e) => setFormData({ ...formData, blDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Número da Referência *</Label>
                  <Input
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Tipo de Frete *</Label>
                  <Select value={formData.freightType} onValueChange={(value) => setFormData({ ...formData, freightType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-emerald-900">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
                  <Label className="text-emerald-900">Email do Contato</Label>
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
                {editingId ? "Atualizar" : "Criar"} Cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : clients?.length === 0 ? (
            <div className="text-center py-8 text-emerald-600">Nenhum cliente cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-200">
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Consignee</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">CNPJ</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Referência</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Porto</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Frete</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients?.map((client) => (
                    <tr key={client.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                      <td className="py-3 px-4">{client.consignee}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatCNPJ(client.cnpj)}</td>
                      <td className="py-3 px-4">{client.referenceNumber}</td>
                      <td className="py-3 px-4">{client.portOrigin && client.portDestination ? `${client.portOrigin} / ${client.portDestination}` : client.portOrigin || client.portDestination || "-"}</td>
                      <td className="py-3 px-4">{client.freightType}</td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(client)}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ id: client.id })}
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
