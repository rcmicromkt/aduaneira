---
description: Como fazer deploy da aplicação para o Cloudflare Workers no Windows
---

Este workflow descreve os passos para realizar o build e deploy da aplicação completa (Frontend + Backend) para o Cloudflare Workers.

### Pré-requisitos
- Node.js instalado
- `pnpm` instalado (`npm install -g pnpm`)
- Conta no Cloudflare

### Passos para Deploy

1.  **Configurar Variáveis de Ambiente de Produção**
    Copie o arquivo de exemplo e preencha com seus dados reais:
    ```powershell
    copy .env.production.example .env.production
    ```
    Edite o `.env.production` com seu `DATABASE_URL` (Aiven), `JWT_SECRET`, etc.

2.  **Login no Cloudflare**
    // turbo
    ```powershell
    npx wrangler login
    ```

3.  **Executar o Build**
    O build gera o bundle do backend em `dist/index.js` e o frontend em `client/dist`.
    // turbo
    ```powershell
    npm run build
    ```

4.  **Configurar Secrets no Cloudflare**
    As variáveis sensíveis devem ser enviadas como "secrets":
    // turbo
    ```powershell
    # Exemplo para o Banco de Dados (pegue o valor do seu .env.production)
    wrangler secret put DATABASE_URL --env production
    wrangler secret put JWT_SECRET --env production
    ```
    *Dica: Você precisará colar os valores quando o comando solicitar.*

5.  **Realizar o Deploy**
    // turbo
    ```powershell
    npx wrangler deploy --env production
    ```

### Comandos Úteis após o Deploy
- **Ver Logs em Tempo Real**: `npx wrangler tail --env production`
- **Listar Deploys**: `npx wrangler deployments list --env production`
