Reescrever o módulo `/queues` para replicar `appjulia/agente/filas` em fluxo, regras e UX, mantendo nossas tabelas atuais (`queues`, `queue_providers`, `clients.settings`).

## Diferenças hoje × appjulia

| Aspecto | MarI.A. (hoje) | appjulia |
|---|---|---|
| Limite | `plan.settings.queues_count` apenas | `client.settings.QUEUE_LIMIT` (override) → padrão 1 |
| Criação | Dialog único | **Wizard 3 etapas** (canal → provedor → nome) |
| WABA | Provedor global | Credenciais por fila via **Embedded Signup + listagem de números** |
| Exclusão | Confirm simples | **Soft-delete** + migração de conversas ativas para outra fila |
| Card | Lista vertical | Grid responsivo (sm:2, lg:3) com dropdown, badges, switches de automação |
| Restaurar | Não existe | Toggle "Mostrar excluídas" + diálogo de restauração com migração |
| Edição | Dialog completo | **QueueFormDialog enxuto** (só nome + credenciais editáveis) |
| Auto-resolve phone | Não existe | Fire-and-forget após criar/editar credenciais |

## Etapas de implementação

### 1. Limite por cliente
- Atualizar `getQueuesUsage` e `upsertQueueFull` em `src/lib/providers.functions.ts` para ler primeiro `clients.settings.queues_count`, default `1` (igual appjulia). Manter fallback opcional em `plan.settings.queues_count`.

### 2. Schema (migração)
- Adicionar em `queues`: `evo_instance` já existe; garantir `phone_resolved_at timestamptz`, `waba_number_id text`, `settings jsonb default '{}'`.
- Confirmar `is_deleted`, `deleted_at` (já existem).
- Sem novas tabelas — pulamos `queue_agent_links` nesta fase (não há vínculo agente×fila no MarI.A. ainda).

### 3. Backend (`providers.functions.ts`)
Adicionar server fns que espelham as actions do edge `queue-management`:
- `listQueuesFull({ include_deleted })` — já existe, adicionar flag.
- `createQueueFull` — valida limite, gera `evo_instance = QUEUE_{userId}_{rand}` quando uazapi, cria fila, dispara resolve-phone (stub).
- `updateQueueFull` — atualiza campos editáveis + dispara resolve-phone se credenciais mudaram.
- `deleteQueueFull({ queue_id, migrate_to_queue_id?, force? })` — soft delete; se houver conversas ativas, exige `migrate_to_queue_id` ou `force: true`. Faz `UPDATE chat_conversations SET queue_id=destino` antes do soft-delete.
- `restoreQueueFull({ queue_id, migrate_to_queue_id? })` — limpa `is_deleted/deleted_at`; opcionalmente migra conversas de outra fila para esta.
- `countActiveConversations({ queue_id })` — para o diálogo de exclusão.

### 4. Hook unificado `useQueues`
`src/hooks/useQueues.ts` com `useQueues(includeDeleted)` + `useQueueMutations()` expondo `createQueue/updateQueue/deleteQueue/restoreQueue`. Substitui parte do `useQueuesAdmin`.

### 5. Componentes (em `src/components/admin/queues/`)
- **QueueWizardDialog.tsx** — wizard 3 passos:
  - **Step 1**: grid de 4 cards de canal (uazapi/waba/webchat/instagram) com badge "Provedor configurado / Sem provedor / Conecte ao criar".
  - **Step 2**: WebChat → vazio; UaZapi/Instagram → `<Select>` de provedores filtrados por tipo; WABA → `WabaEmbeddedSignupButton` (já existe) + select de números (`/v20.0/{businessId}/phone_numbers`) + botão "Testar conexão".
  - **Step 3**: nome da fila + preview do `evo_instance`.
  - Botões Voltar/Avançar/Criar, validação por etapa, alerta de limite atingido.
- **QueueFormDialog.tsx** (edição) — campos: nome + credenciais do tipo + switch ativa.
- **QueueCard.tsx** — grid card com: ícone do canal, badge status (Ativa/Inativa/Excluída), identificador (Instância/Phone Number ID), dropdown (Editar / Acessos / Excluir | Restaurar), switches de automação por fila lidos de `queue.settings` (`auto_transcribe_audio`, `auto_summary_on_resolve`, `auto_summary_on_close`).
- **DeleteQueueDialog.tsx** — conta conversas ativas via `countActiveConversations`; se >0 exige select de fila destino OU switch "Excluir sem migrar"; campo "digite o nome" + switch confirmação.
- **RestoreQueueDialog.tsx** — restaura simples ou com migração de conversas de outra fila para esta.

### 6. Página `/queues`
Reescrever `src/routes/_authenticated/queues.tsx` espelhando `FilasPage.tsx`:
- Header: título + subtitulo "X / Y filas usadas".
- Botão "Nova Fila" → abre wizard; se limite atingido, abre AlertDialog "Limite de filas atingido".
- Toggle "Mostrar excluídas".
- Grid responsivo de `QueueCard`. Empty state amigável.
- Substituir `QueuesList` antigo.

### 7. Aba "Filas" em Configurações
- `src/routes/_authenticated/configuracoes.tsx`: aba Filas passa a renderizar um componente `QueuesPanel` (extrair de queues.tsx) para reuso, mantendo Provedores e Webhooks como estão.

### 8. Webhooks (sem mudanças nesta fase)
Os webhooks `evolution/instagram/waba/webchat` já existem em `src/routes/api/public/webhooks/` apontando por `queue_id`. Mantém — appjulia usa edge functions equivalentes.

### 9. Limpeza
Remover `QueueDialog.tsx` antigo (substituído pelo wizard + form de edição). Manter `useQueuesAdmin` apenas para superadmin/superview se necessário, ou remover.

## Regras-chave preservadas
- `client_id` sempre vem do usuário logado (`getUserClientId`).
- Provedores continuam globais (configuração superadmin).
- Limite default = 1 quando não definido (igual appjulia).
- Soft-delete preserva histórico de conversas.
- Auto-resolve phone fica como stub agora — implementação real depende do provider UaZapi/WABA.

## Fora de escopo (futuro)
- `queue_agent_links` + diálogo "Manage Agents".
- `QueueAccessDialog` (RBAC por fila).
- `QueueQRCodeDialog` UaZapi (depende de integração viva).
- `UazapiInstanceStatus` em tempo real.
