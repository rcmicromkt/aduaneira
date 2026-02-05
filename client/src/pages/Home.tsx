import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Package, TrendingUp, Lock, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-900">Desembaraço Aduaneiro</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-emerald-900 mb-6">
            Gestão Completa de Operações Aduaneiras
          </h2>
          <p className="text-xl text-emerald-700 mb-8">
            Sistema profissional para controlar clientes, fornecedores, taxas e lucro em operações de desembaraço aduaneiro
          </p>
          <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700">
            <a href={getLoginUrl()}>Começar Agora</a>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="bg-white rounded-xl p-6 border border-emerald-100 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-emerald-900 mb-2">Gestão de Operações</h3>
            <p className="text-sm text-emerald-700">Cadastre e acompanhe todas as suas operações de desembaraço</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-emerald-100 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-emerald-900 mb-2">Faturas e Recibos</h3>
            <p className="text-sm text-emerald-700">Gere automaticamente PDFs de faturas e recibos profissionais</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-emerald-100 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-emerald-900 mb-2">Análise de Lucro</h3>
            <p className="text-sm text-emerald-700">Visualize o lucro por operação e relatórios financeiros detalhados</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-emerald-100 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-emerald-900 mb-2">Segurança</h3>
            <p className="text-sm text-emerald-700">Autenticação segura com controle de acesso por perfil</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-emerald-700">
          <p>&copy; 2024 Sistema de Desembaraço Aduaneiro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
