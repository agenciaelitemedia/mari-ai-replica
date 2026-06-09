## Objetivo

Portar o módulo de **Filas integradas a Provedores de Canais** do `appjulia` para o MarI.A., replicando o comportamento original: cadastro centralizado de provedores (UazAPI, Evolution API, WABA Oficial, Instagram, Webchat) em **Configurações → Provedores**, criação de **Filas** vinculadas a um provedor, e liberação por `client_id`.

## Provedores suportados (exatamente como no appjulia)

| Tipo | Campos específicos |
|---|---|
| **UazAPI** | `base_url`, `token`, `instance_name`, `phone_number` |
| **Evolution API** | `base_url`, `apikey`, `instance_name`, `phone_number` |
| **WABA Oficial** (Meta Cloud) | `waba_id`, `phone_number_id`, `access_token`, `app_secret`, `verify_token` |
| **Instagram** (Meta) | `ig_business_id`, `page_id`, `access_token`, `verify_token` |
| **Webchat** | `widget_key` (gerado), `allowed_origins[]`, `welcome_message`, `color` |

Todos compartilham: `name`, `client_id`, `is_active`, `metadata` (jsonb para extensões).

## Análise do estado atual

Banco já tem:
- `queues` com `client_id`, `channel_type`, `evo_url/apikey/instance`, `phone_number`, `waba_*`, `metadata`, `is_active`, `is_deleted`
- `queue_providers` com `client_id`, `provider_type`, `name`, `evo_url`, `evo_apikey`, `metadata` (sem campos WABA/Instagram/Webchat)
- `plans.settings` jsonb com `queues_count`

Código já tem:
- `src/lib/chat.functions.ts` com `listQueues` / `upsertQueue` simplificado para UazAPI
- `src/routes/_authenticated/configuracoes.tsx` com formulário plano UazAPI
- Webhook público `/api/public/webhooks/uazapi`

Falta: provedores reutilizáveis multi-tipo, vínculo fila→provedor, isolamento por `client_id`, limite de filas por plano, UI com abas, webhooks Evolution/WABA/Instagram/Webchat.

## Plano de execução

### Etapa 1 — Banco de dados (1 migration)

**`queue_providers`** — estender:
- `provider_type` passa a aceitar: `uazapi`, `evolution`, `waba`, `instagram`, `webchat`
- Adicionar colunas: `phone_number text`, `instance_name text`, `waba_id text`, `phone_number_id text`, `access_token text`, `app_secret text`, `verify_token text`, `widget_key text unique`, `allowed_origins text[]`
- Tudo sensível continua em colunas dedicadas (não em metadata) para indexação
- Índice `(client_id, is_active)` e `(provider_type)`
- RLS: superadmin tudo, demais só do próprio `profiles.client_id`
- GRANT `authenticated` + `service_role`

**`queues`** — estender:
- Adicionar `provider_id uuid references queue_providers(id) on delete restrict`
- Adicionar `settings jsonb default '{}'` (horários, distribuição, fallback)
- Índice `(provider_id)`, `(client_id, is_active)`

**Seed de módulos**:
- Inserir em `modules` os códigos `providers` e `queues` (categoria `sistema`) para aparecerem na tela de permissões

### Etapa 2 — Server functions

Criar **`src/lib/providers.functions.ts`**:
- `listProviders({ clientId?, type? })` — superadmin filtra livre; demais travados no próprio client
- `upsertProvider(input)` — validação Zod com `discriminatedUnion` por `provider_type` para garantir os campos corretos de cada tipo
- `deleteProvider({ id })` — bloqueia se houver `queues` vinculadas (retorna lista das filas)
- `testProvider({ id })` — ping no provedor:
  - UazAPI: `GET {base_url}/instance/status` com header `token`
  - Evolution: `GET {base_url}/instance/connectionState/{instance}` com header `apikey`
  - WABA: `GET https://graph.facebook.com/v20.0/{phone_number_id}` com Bearer
  - Instagram: `GET https://graph.facebook.com/v20.0/{ig_business_id}` com Bearer
  - Webchat: retorna `{ ok: true, widget_url }`
- `generateWebchatKey()` — helper para gerar `widget_key` aleatório seguro

Ajustar **`src/lib/chat.functions.ts`**:
- `upsertQueue` aceita `provider_id` obrigatório; ao salvar, faz snapshot dos campos do provedor em `queues.metadata.provider_snapshot` para o webhook continuar resolvendo sem JOIN
- `listQueues` retorna `provider:queue_providers(id, name, provider_type)`
- Validar `queues_count` do plano do cliente antes de inserir (consulta `clients.plan_id → plans.settings.queues_count`)
- `sendMessage` roteia pelo `provider_type` da fila (UazAPI/Evolution/WABA/Instagram/Webchat já no envio)

### Etapa 3 — Webhooks por provedor (server routes em `src/routes/api/public/webhooks/`)

- `uazapi.ts` — já existe, ajustar para resolver fila via `provider_id`
- `evolution.ts` — novo, valida `apikey` no header, normaliza payload para `chat_messages`
- `waba.ts` — novo, GET responde challenge (`hub.verify_token`), POST valida `X-Hub-Signature-256` com `app_secret`
- `instagram.ts` — novo, mesmo padrão do WABA
- `webchat.ts` — novo, valida `widget_key` na query, aceita `POST { message, visitor_id }`

### Etapa 4 — UI Configurações reescrita com abas

`src/routes/_authenticated/configuracoes.tsx` passa a usar `Tabs`:

```text
[Provedores] [Filas] [Webhooks] [Geral]
```

- **Aba Provedores**: lista com filtro por cliente (superadmin) e por tipo; cards mostram tipo, nome, status, badge do client. Botão "Novo provedor" abre `ProviderDialog` com:
  - Step 1: tipo (cards visuais com ícone de cada provedor)
  - Step 2: campos dinâmicos conforme o tipo escolhido
  - Step 3: testar conexão + salvar
  - Ações por item: editar, testar, ativar/desativar, excluir (SweetAlert2)

- **Aba Filas**: lista com badge do provedor e tipo de canal. Botão "Nova fila" abre `QueueDialog`:
  - Cliente (superadmin) / travado para demais
  - Select de Provedor filtrado pelo client
  - Nome, número/identificador, `settings` (horário, mensagem de saudação)
  - Validação: bloqueia se exceder `queues_count` do plano

- **Aba Webhooks**: mostra URL pública de cada provedor com botão copiar e instruções específicas (verify_token para WABA/Instagram, widget snippet para Webchat)

- **Aba Geral**: dados gerais da empresa (mantém o que já existe)

### Etapa 5 — Componentes e hooks novos

```text
src/components/admin/providers/
  ProvidersList.tsx
  ProviderDialog.tsx
  ProviderTypeStep.tsx
  ProviderFieldsUazapi.tsx
  ProviderFieldsEvolution.tsx
  ProviderFieldsWaba.tsx
  ProviderFieldsInstagram.tsx
  ProviderFieldsWebchat.tsx
src/components/admin/queues/
  QueuesList.tsx
  QueueDialog.tsx
src/hooks/
  useProvidersAdmin.ts
  useQueuesAdmin.ts
src/lib/providers.functions.ts
src/lib/providers.types.ts   # Zod schemas + discriminated union
```

### Etapa 6 — Permissões e isolamento

- Módulos `providers` e `queues` registrados → aparecem na tela de Permissões
- Server fns sempre filtram por `client_id` quando o usuário não é superadmin (lookup via `profiles.client_id`)
- RLS espelha a mesma regra como segunda camada

### Etapa 7 — Regras de negócio (idênticas ao appjulia)

- Provedor inativo não aparece no select de Filas
- Excluir provedor com filas → SweetAlert2 lista filas e bloqueia
- Limite de filas por plano: toast e bloqueio na criação
- Webchat: ao criar provedor, gera `widget_key` automaticamente e exibe snippet `<script src=".../widget.js?key=...">`
- WABA/Instagram: `verify_token` gerado automaticamente se vazio
- Snapshot dos campos do provedor em `queues.metadata.provider_snapshot` ao salvar a fila (para o webhook funcionar mesmo se o provedor for desativado momentaneamente)

## Entregáveis

- 1 migration (extensão de `queue_providers`, `queues`, seed de módulos)
- 1 arquivo novo `providers.functions.ts` + `providers.types.ts`
- Ajustes em `chat.functions.ts`
- 4 webhooks novos em `src/routes/api/public/webhooks/`
- Reescrita de `configuracoes.tsx` com 4 abas
- 9 componentes novos em `src/components/admin/{providers,queues}/`
- 2 hooks novos

Posso seguir com a implementação?
