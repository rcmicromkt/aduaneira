#!/bin/bash

# ============================================
# Script de Deploy para Cloudflare Workers
# ============================================
# Este script automatiza o processo de build e deploy

set -e  # Parar em caso de erro

echo "🚀 Iniciando processo de deploy..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================
# PASSO 1: Verificar pré-requisitos
# ============================================
echo "📋 Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado"
    exit 1
fi
print_step "Node.js instalado: $(node --version)"

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm não está instalado. Instale com: npm install -g pnpm"
    exit 1
fi
print_step "pnpm instalado: $(pnpm --version)"

if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler não está instalado. Instale com: npm install -g wrangler"
    exit 1
fi
print_step "Wrangler instalado: $(wrangler --version)"

echo ""

# ============================================
# PASSO 2: Verificar arquivo .env.production
# ============================================
echo "🔐 Verificando variáveis de ambiente..."

if [ ! -f ".env.production" ]; then
    print_warning "Arquivo .env.production não encontrado"
    echo "Criando a partir de .env.production.example..."
    cp .env.production.example .env.production
    print_warning "Edite .env.production com seus valores reais antes de fazer deploy!"
    exit 1
fi
print_step "Arquivo .env.production encontrado"

echo ""

# ============================================
# PASSO 3: Instalar dependências
# ============================================
echo "📦 Instalando dependências..."
pnpm install
print_step "Dependências instaladas"

echo ""

# ============================================
# PASSO 4: Executar testes (opcional)
# ============================================
echo "🧪 Executando testes..."
if pnpm test 2>/dev/null; then
    print_step "Testes passaram"
else
    print_warning "Alguns testes falharam (continuando com deploy)"
fi

echo ""

# ============================================
# PASSO 5: Build
# ============================================
echo "🔨 Compilando projeto..."

# Limpar builds anteriores
rm -rf dist client/dist

# Executar build
pnpm build

if [ ! -f "dist/index.js" ]; then
    print_error "Build do backend falhou"
    exit 1
fi
print_step "Backend compilado: dist/index.js"

if [ ! -d "client/dist" ]; then
    print_error "Build do frontend falhou"
    exit 1
fi
print_step "Frontend compilado: client/dist"

echo ""

# ============================================
# PASSO 6: Verificar configuração Wrangler
# ============================================
echo "⚙️  Verificando configuração Wrangler..."

if [ ! -f "wrangler.toml" ]; then
    print_error "Arquivo wrangler.toml não encontrado"
    exit 1
fi
print_step "Arquivo wrangler.toml encontrado"

echo ""

# ============================================
# PASSO 7: Verificar se está autenticado no Cloudflare
# ============================================
echo "🔑 Verificando autenticação Cloudflare..."

if ! wrangler whoami &> /dev/null; then
    print_warning "Não autenticado no Cloudflare"
    echo "Executando: wrangler login"
    wrangler login
fi
print_step "Autenticado no Cloudflare"

echo ""

# ============================================
# PASSO 8: Adicionar secrets (se necessário)
# ============================================
echo "🔐 Configurando secrets..."

# Ler do .env.production e adicionar como secrets
if grep -q "DATABASE_URL" .env.production; then
    DB_URL=$(grep "^DATABASE_URL=" .env.production | cut -d '=' -f 2-)
    if [ ! -z "$DB_URL" ]; then
        echo "Adicionando DATABASE_URL como secret..."
        echo "$DB_URL" | wrangler secret put DATABASE_URL --env production
        print_step "DATABASE_URL adicionado"
    fi
fi

if grep -q "JWT_SECRET" .env.production; then
    JWT=$(grep "^JWT_SECRET=" .env.production | cut -d '=' -f 2-)
    if [ ! -z "$JWT" ]; then
        echo "Adicionando JWT_SECRET como secret..."
        echo "$JWT" | wrangler secret put JWT_SECRET --env production
        print_step "JWT_SECRET adicionado"
    fi
fi

echo ""

# ============================================
# PASSO 9: Deploy
# ============================================
echo "🚀 Fazendo deploy para Cloudflare Workers..."

if wrangler deploy --env production; then
    print_step "Deploy realizado com sucesso!"
else
    print_error "Deploy falhou"
    exit 1
fi

echo ""

# ============================================
# PASSO 10: Exibir informações
# ============================================
echo "📊 Informações do Deploy:"
echo ""
wrangler deployments list --env production | head -5

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Acessar: https://desembaraco-aduaneiro.seu-usuario.workers.dev"
echo "2. Verificar logs: wrangler tail --env production"
echo "3. Configurar domínio customizado (opcional)"
echo ""
