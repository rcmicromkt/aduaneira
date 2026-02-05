import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

export default function ProfitPage() {
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const { data: operations } = trpc.operations.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: profitByPeriod } = trpc.reports.getProfitByPeriod.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: filterType === "period" }
  );

  const { data: profitByClient } = trpc.reports.getProfitByClient.useQuery(
    { clientId: parseInt(selectedClientId) || 0 },
    { enabled: filterType === "client" && !!selectedClientId }
  );

  const filteredOperations = filterType === "period"
    ? profitByPeriod
    : filterType === "client" && selectedClientId
      ? profitByClient
      : operations;

  const chartData = filteredOperations?.map(op => ({
    name: op.referenceNumber,
    custo: parseFloat(op.totalCost || "0"),
    venda: parseFloat(op.totalSelling || "0"),
    lucro: parseFloat(op.totalProfit || "0"),
    margem: parseFloat(op.profitMargin || "0"),
  })) || [];

  const totalCost = chartData.reduce((sum, item) => sum + item.custo, 0);
  const totalSelling = chartData.reduce((sum, item) => sum + item.venda, 0);
  const totalProfit = chartData.reduce((sum, item) => sum + item.lucro, 0);
  const totalMargin = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

  const pieData = [
    { name: "Custo", value: totalCost },
    { name: "Lucro", value: totalProfit },
  ];

  const COLORS = ["#059669", "#10b981"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-emerald-900">Lucro por Operação</h1>

      {/* Filters */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-emerald-900">Tipo de Filtro</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Operações</SelectItem>
                  <SelectItem value="period">Por Período</SelectItem>
                  <SelectItem value="client">Por Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "period" && (
              <>
                <div>
                  <Label className="text-emerald-900">Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-emerald-900">Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {filterType === "client" && (
              <div>
                <Label className="text-emerald-900">Cliente</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {totalCost.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Custo total das operações</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {totalSelling.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Receita total das operações</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {totalProfit.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Lucro líquido</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{totalMargin.toFixed(2)}%</div>
            <p className="text-xs text-emerald-600">Margem total de lucro</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Custo vs Receita vs Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" stroke="#059669" />
                <YAxis stroke="#059669" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f0fdf4", border: "1px solid #d1fae5" }}
                  formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="custo" fill="#059669" name="Custo" />
                <Bar dataKey="venda" fill="#10b981" name="Receita" />
                <Bar dataKey="lucro" fill="#34d399" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Distribuição: Custo vs Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Detalhamento por Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-200">
                  <th className="text-left py-3 px-4 font-semibold text-emerald-900">Referência</th>
                  <th className="text-right py-3 px-4 font-semibold text-emerald-900">Custo</th>
                  <th className="text-right py-3 px-4 font-semibold text-emerald-900">Receita</th>
                  <th className="text-right py-3 px-4 font-semibold text-emerald-900">Lucro</th>
                  <th className="text-right py-3 px-4 font-semibold text-emerald-900">Margem %</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, idx) => (
                  <tr key={idx} className="border-b border-emerald-100 hover:bg-emerald-50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-right">R$ {item.custo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right">R$ {item.venda.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">R$ {item.lucro.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right">{item.margem.toFixed(2)}%</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-emerald-300 bg-emerald-50">
                  <td className="py-3 px-4 font-bold text-emerald-900">TOTAL</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">R$ {totalCost.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">R$ {totalSelling.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">R$ {totalProfit.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">{totalMargin.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
