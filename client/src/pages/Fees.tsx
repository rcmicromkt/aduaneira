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

export default function FeesPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const queryClient = useQueryClient();
  const { data: fees, isLoading } = trpc.fees.list.useQuery();

  const createMutation = trpc.fees.create.useMutation({
    onSuccess: () => {
      utils.fees.list.invalidate();
      toast.success("Taxa criada com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.fees.update.useMutation({
    onSuccess: () => {
      utils.fees.list.invalidate();
      toast.success("Taxa atualizada com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.fees.delete.useMutation({
    onSuccess: () => {
      utils.fees.list.invalidate();
      toast.success("Taxa deletada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (fee: any) => {
    setFormData({
      name: fee.name,
      description: fee.description || "",
    });
    setEditingId(fee.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-900">Taxas e Tarifas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              + Nova Taxa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingId ? "Editar Taxa" : "Nova Taxa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-emerald-900 font-semibold">
                  Nome da Taxa *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Ocean Freight, Handling, TRS"
                  className="border-emerald-200 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-emerald-900 font-semibold">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada da taxa"
                  className="border-emerald-200 focus:border-emerald-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
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
                  {editingId ? "Atualizar" : "Criar"} Taxa
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
          <CardTitle className="text-emerald-900">Lista de Taxas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-emerald-600">Carregando...</div>
          ) : fees && fees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50 border-b border-emerald-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-emerald-900">Descrição</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                      <td className="py-3 px-4 font-medium text-emerald-900">{fee.name}</td>
                      <td className="py-3 px-4 text-emerald-700">{fee.description || "-"}</td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fee)}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ id: fee.id })}
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
              Nenhuma taxa cadastrada. Clique em "+ Nova Taxa" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
