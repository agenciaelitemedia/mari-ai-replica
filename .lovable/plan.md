## Objetivo

Refatorar o módulo de Provedores do MarI.A. para replicar **exatamente** a aba "Provedores de Fila" do `appjulia` (`/admin/chat`), trazendo-a como uma **aba dentro de Configurações**. O módulo Filas continua separado, vinculado por `provider_id`.

## Análise do appjulia

Em `appjulia`, a aba **Provedores** é composta por 3 peças:

1. **`useQueueProviders`** — hook único com `useQuery` listando `queue_providers` (filtrável por `provider_type`) + mutations `create/update/delete` que injetam `client_id` do usuário logado.
2. **`ProviderCard`** — card com ícone por tipo (Phone/MessageSquare/Globe/Instagram), badge Ativo/Inativo, menu Editar/Excluir, detalhe específico (URL UaZapi, Business ID WABA, Página IG).
3. **`ProviderFormDialog`** — dialog único com:
   - Campo **Nome** + **Tipo** (Select, bloqueado em edição)
   - **UaZapi**: `evo_url` + `evo_apikey` (admin token, type=password)
   - **WABA**: bloco azul com botão **Embedded Signup Meta** (preenche `waba_business_id` + `waba_token` automaticamente) + `<Collapsible>` "Configuração avançada (app próprio)" com `meta_app_id`, `meta_app_secret`, `waba_business_id`, `waba_token` manuais
   - **Instagram**: `instagram_page_id`, `instagram_user_id`, `page_access_token`, `page_name`
   - **WebChat**: apenas nome (config interna)

## Mudanças

### 1. Banco — alinhar colunas com appjulia

Migration adicionando à `queue_providers` (mantém colunas atuais sem quebrar):
- `meta_app_id text`, `meta_app_secret text`, `waba_business_id text`, `waba_token text`
- `instagram_page_id text`, `instagram_user_id text`, `page_access_token text`, `page_name text`
- `webchat_config_id uuid`
- Backfill: copiar valores existentes (`waba_id`→`waba_business_id`, `access_token`→`waba_token` quando type=waba; `ig_business_id`→`instagram_user_id`, `page_id`→`instagram_page_id`, `access_token`→`page_access_token` quando type=instagram).

### 2. Frontend — substituir componentes atuais

- **Refazer `src/components/admin/providers/ProviderDialog.tsx`** seguindo `ProviderFormDialog.tsx` do appjulia (mesma estrutura/labels/Collapsible; remover stepper atual).
- **Refazer `src/components/admin/providers/ProvidersList.tsx`** como **grid de `ProviderCard`** (ícone+badge+dropdown), removendo tabela atual.
- Criar `src/components/admin/providers/ProviderCard.tsx` portado 1:1.
- Atualizar `src/lib/providers.types.ts` e `src/lib/providers.functions.ts` (`upsertProvider`) para aceitar os novos campos.
- Atualizar `useProvidersAdmin` para refletir novos campos no mutate.
- **WABA Embedded Signup**: stub inicial `WabaEmbeddedSignupButton` com `onSuccess` manual (até configurar Meta App ID no projeto) — alerta "Configure Meta App ID nas secrets para ativar".

### 3. Aba dentro de Configurações

- Em `src/routes/_authenticated/configuracoes.tsx`, adicionar/garantir aba **"Provedores"** que renderiza o mesmo conteúdo de `src/routes/_authenticated/providers.tsx`.
- Extrair o miolo de `providers.tsx` em `src/components/admin/providers/ProvidersPanel.tsx` reutilizável (rota standalone continua existindo e importa o painel).
- Aba **"Filas"** permanece (já existe) e usa `provider_id` para vincular.

### 4. Regras preservadas

- Isolamento por `client_id` (RLS atual mantida; super admin pode escolher cliente).
- `queues.provider_id` continua FK para `queue_providers.id`.
- Tipos suportados (alinhados ao appjulia): `uazapi`, `waba`, `instagram`, `webchat`. **Evolution** removido do select (era variação não presente no appjulia) — pode ser reativado futuramente.

## Detalhes técnicos

```text
src/
├── components/admin/providers/
│   ├── ProviderCard.tsx          NEW  (porte 1:1)
│   ├── ProviderDialog.tsx        REWRITE (= ProviderFormDialog appjulia)
│   ├── ProvidersList.tsx         REWRITE (grid de ProviderCard)
│   ├── ProvidersPanel.tsx        NEW    (extrai conteúdo da rota)
│   └── WabaEmbeddedSignupButton.tsx NEW (stub)
├── lib/
│   ├── providers.types.ts        +novos campos
│   └── providers.functions.ts    +novos campos no upsert
├── routes/_authenticated/
│   ├── providers.tsx             usa <ProvidersPanel />
│   └── configuracoes.tsx         +tab "Provedores" usando <ProvidersPanel />
supabase/migrations/
└── <ts>_providers_align_appjulia.sql   adiciona colunas + backfill
```

Sem mudanças em webhooks, hooks de Filas, ou rotas de API.
