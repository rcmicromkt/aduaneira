# Sistema de Desembaraço Aduaneiro - TODO

## Fase 1: Schema do Banco de Dados e APIs Backend
- [x] Criar schema de clientes com validação de CNPJ
- [x] Criar schema de fornecedores com dados fiscais
- [x] Criar schema de taxas/tarifas aduaneiras
- [x] Criar schema de operações de desembaraço
- [x] Criar schema de faturas vinculadas a operações
- [x] Criar schema de recibos vinculados a faturas
- [x] Criar relacionamentos entre tabelas (FK)
- [x] Implementar APIs tRPC para CRUD de clientes
- [x] Implementar APIs tRPC para CRUD de fornecedores
- [x] Implementar APIs tRPC para CRUD de taxas
- [x] Implementar APIs tRPC para CRUD de operações
- [x] Implementar APIs tRPC para CRUD de faturas
- [x] Implementar APIs tRPC para CRUD de recibos
- [x] Implementar API para cálculo de lucro por operação
- [x] Implementar API para relatórios financeiros com filtros
- [x] Implementar notificação ao proprietário para novas operações

## Fase 2: Telas de Cadastro
- [x] Criar layout de dashboard com sidebar
- [x] Implementar tela de login com autenticação
- [x] Implementar tela de cadastro de clientes
- [x] Implementar tela de listagem de clientes
- [x] Implementar tela de edição de clientes
- [x] Implementar tela de cadastro de fornecedores
- [x] Implementar tela de listagem de fornecedores
- [x] Implementar tela de edição de fornecedores
- [x] Implementar tela de cadastro de taxas
- [x] Implementar tela de listagem de taxas
- [x] Implementar tela de edição de taxas
- [x] Implementar tela de cadastro de operações
- [x] Implementar tela de listagem de operações
- [x] Implementar tela de edição de operações

## Fase 3: Geração de PDFs
- [ ] Implementar geração de PDF de fatura
- [ ] Implementar geração de PDF de recibo
- [ ] Estilizar PDFs com paleta verde
- [ ] Adicionar detalhes de custos e taxas nos PDFs

## Fase 4: Dashboard Financeiro
- [x] Implementar tela de lucro por operação
- [x] Implementar cálculo automático de margem
- [x] Implementar filtros por período
- [x] Implementar filtros por cliente
- [x] Implementar relatórios com gráficos
- [x] Implementar somatórios gerais

## Fase 5: Interface Visual
- [x] Aplicar paleta de cores em tons de verde
- [x] Estilizar componentes com Tailwind
- [x] Garantir responsividade
- [x] Adicionar ícones profissionais
- [x] Refinamento visual geral

## Fase 6: Testes e Otimizações
- [ ] Testes de validação de formulários
- [ ] Testes de cálculos financeiros
- [ ] Testes de geração de PDFs
- [ ] Testes de permissões (admin/usuário)
- [ ] Otimização de performance
- [ ] Testes de responsividade

## Funcionalidades Adicionais
- [ ] Controle de acesso baseado em roles (admin/usuário)
- [ ] Auditoria de operações
- [ ] Histórico de mudanças

## Fase 7: Correções e Melhorias
- [ ] Corrigir menu de navegação para mostrar todas as opções
- [ ] Adicionar links para Clientes, Fornecedores, Taxas, Operações, Faturas, Lucro
- [ ] Melhorar layout do DashboardLayout
- [ ] Testar navegação entre páginas

## Fase 7: Reorganização de Taxas e Faturas
- [x] Remover campo de valor da tabela de taxas
- [x] Atualizar schema para remover valor_unitario e unidade de taxas
- [x] Adicionar campo de valor_dolar na tabela de operações
- [x] Criar tabela de invoice_items para vincular múltiplas taxas a uma fatura
- [x] Atualizar tela de Taxas para mostrar apenas nome
- [x] Atualizar tela de Operações para adicionar campo de valor do dólar
- [x] Atualizar tela de Faturas com seleção de múltiplas taxas
- [x] Adicionar campo de moeda (R$ ou USD) para cada taxa na fatura
- [x] Adicionar campo de valor para cada taxa na fatura
- [x] Implementar botão "+Adicionar Taxa" nas faturas
- [ ] Testar fluxo completo de criação de fatura com múltiplas taxas

## Fase 8: Correção de Fluxo de Dólar e Cálculos
- [x] Remover campo de valor do dólar da tabela de operações
- [x] Adicionar campo de valor do dólar na tabela de faturas
- [x] Atualizar tela de Operações (remover campo dólar)
- [x] Atualizar tela de Faturas com campo de valor do dólar
- [x] Implementar cálculo automático de total na fatura
- [x] Considerar conversão USD para BRL no cálculo
- [ ] Testar cálculos com múltiplas taxas em moedas diferentes

- [x] Mostrar valor total de cada taxa (com conversão USD/BRL) no menu de faturas
- [x] Aumentar tamanho do modal de faturas para exibir todas as informações sem scroll horizontal
- [x] Corrigir layout do modal de faturas para não sair da tela - tornar taxas mais compactas
- [x] Corrigir cor do texto ao passar mouse no menu lateral (hover) - texto fica branco e invisível
- [x] Alterar cor do item ativo do menu para verde escuro em vez de branco
- [x] Corrigir cor do texto do botão Faturas para verde escuro (está muito claro)
- [x] Forçar texto verde escuro em todos os estados do menu (inclusive hover)
- [x] Quando item do menu está selecionado, texto deve ser branco (não verde escuro)
- [x] Adicionar campo Porto (origem/destino) no cadastro de clientes
