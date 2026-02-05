import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading } = trpc.reports.getSummary.useQuery();
  const { data: operations } = trpc.operations.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const chartData = operations?.slice(0, 10).map(op => ({
    name: op.referenceNumber,
    custo: parseFloat(op.totalCost || "0"),
    venda: parseFloat(op.totalSelling || "0"),
    lucro: parseFloat(op.totalProfit || "0"),
  })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total de Operações</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{summary?.totalOperations || 0}</div>
            <p className="text-xs text-emerald-600">Operações cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {(summary?.totalCost || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Custo total de operações</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {(summary?.totalSelling || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Receita total de operações</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {(summary?.totalProfit || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600">Lucro líquido</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Custo vs Venda por Operação</CardTitle>
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
                <Bar dataKey="custo" fill="#10b981" name="Custo" />
                <Bar dataKey="venda" fill="#059669" name="Venda" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Lucro por Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" stroke="#059669" />
                <YAxis stroke="#059669" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f0fdf4", border: "1px solid #d1fae5" }}
                  formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
                />
                <Line type="monotone" dataKey="lucro" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-emerald-600 mb-2">Margem Média</p>
              <p className="text-2xl font-bold text-emerald-700">
                {(summary?.averageMargin || 0).toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-emerald-600 mb-2">Ticket Médio</p>
              <p className="text-2xl font-bold text-emerald-700">
                R$ {((summary?.totalSelling || 0) / (summary?.totalOperations || 1)).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-emerald-600 mb-2">Taxa de Lucro</p>
              <p className="text-2xl font-bold text-emerald-700">
                {((summary?.totalProfit || 0) / (summary?.totalSelling || 1) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
