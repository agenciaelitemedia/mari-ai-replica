# MarI.A — Migração do appjulia

Este projeto é uma migração faseada de [agenciaelitemedia/appjulia](https://github.com/agenciaelitemedia/appjulia) (Vite + React 18 + React Router + Tailwind v3) para a stack moderna Lovable (TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + Cloudflare Workers + Lovable Cloud).

## Fase 2 — Chat/WhatsApp concluída ✅

- Tabelas novas: `chat_conversations` (com protocolo automático), `chat_conversation_history`, `chat_tags`, `chat_conversation_tags`, `chat_departments`, `chat_message_reactions`, `queues` (instâncias UazAPI/WABA), `queue_providers`.
- `chat_messages` estendida com `conversation_id`, `internal_note`, `sender_name`.
- Realtime habilitado em `chat_conversations`.
- Server functions (`src/lib/chat.functions.ts`): `listConversations`, `listMessages`, `sendMessage` (envia via UazAPI `POST /send/text` quando há fila configurada), `listQueues`, `upsertQueue`.
- Webhook público UazAPI: `src/routes/api/public/webhooks/uazapi.ts` — verifica token da fila, faz upsert de contato, abre conversa se não existir e grava mensagem; URL pública: `https://project--{id}.lovable.app/api/public/webhooks/uazapi?queue_id=...&token=...`.
- UI `/chat` com lista de conversas + thread + envio + realtime (`postgres_changes`).
- UI `/configuracoes` para cadastrar instâncias UazAPI (URL, token, instance, número) e exibe o webhook a configurar no painel UazAPI.


## Fase 1 — concluída ✅

- Lovable Cloud habilitado (banco PostgreSQL + Auth + Storage gerenciados).
- Auth foundation criada: `profiles`, `user_roles` (enum `app_role`), função `has_role`, trigger `handle_new_user` que cria perfil + papel `user` automaticamente no signup.
- Tabelas centrais do appjulia portadas:
  - **Chat**: `chat_contacts`, `chat_messages` (com realtime)
  - **CRM**: `crm_boards`, `crm_pipelines`, `crm_deals`, `crm_deal_history`, `crm_custom_fields` (com realtime)
- UI base:
  - `/auth` — login + signup com e-mail/senha
  - `/_authenticated/*` — layout protegido com sidebar e gate `ssr:false + getUser`
  - Stubs navegáveis: dashboard, chat, crm, contatos, agentes, comercial, criativos, legal-cases, telefonia, equipe, configurações, admin
- `onAuthStateChange` wirado em `__root.tsx`; sign-out limpa cache + redireciona.
- Toaster (sonner) montado globalmente.

## Pendente (fases futuras)

### Migrations não aplicadas (~205 dos 236 arquivos do appjulia)
Não foram aplicadas as tabelas dos módulos abaixo. Aplicar quando cada módulo for portado:

| Módulo | Tabelas principais (prefixos) | Edge functions originais |
|---|---|---|
| Chat avançado | `chat_conversations`, `chat_campaigns*`, `chat_bots*`, `chat_routing_rules`, `chat_sla_configs`, `chat_kb_*`, `chat_csat_*`, `chat_tags`, `chat_audit_log`, `chat_lgpd_requests`, … | uazapi-*, waba-*, chat-ai-*, chat-automation-*, chat-campaign-*, instagram-*, support-*, webchat-api |
| CRM avançado | `crm_copilot_*`, `crm_comercial_*`, `crm_checklists`, `crm_internal_notes`, `crm_audit_log` | crm-copilot-monitor, batch-generate-scripts |
| Agentes IA / config | `ai_provider_keys`, `ai_usage_logs`, `client_ai_model_config*`, `agent_aliases`, `agent_change_log` | ai-provider-key-set, chat-ai-assist, chat-ai-process, copilot-chat, prompt-generator |
| Jurídico | `datajud_*`, `legal_cases*`, `contract_*`, `zapsign*` | datajud-monitor, datajud-search, contract-notifications-*, zapsign-* |
| Telefonia | `chat_call_logs`, `telephony_*`, `queue_*`, `dispatcher_heartbeat`, `threecplus_*`, `api4com_*`, `vellip_*` | queue-*, telephony-*, threecplus-*, api4com-*, vellip-webhook, sync-queue-to-agent |
| Pagamentos | (tabelas de orders/checkouts/webhooks) | asaas-*, mercadopago-*, infinitypay-*, queue-order-*, telephony-order-*, video-order-* |
| Marketing | `meta_*` | meta-ads, meta-auth, meta-conversions, meta-send-test, meta-webhook, instagram-* |
| Vídeo | `video_call_records`, `video_room*` | video-room, video-provision, video-order-* |
| Notificações | `internal_notification_*`, `contract_notification_*` | internal-notification-*, send-push, refresh-contact-avatar |
| AdvBox | `advbox_*` | advbox-* |

Total: **~205 migrations** + **~90 edge functions** ainda por portar.

### Edge functions → server functions TanStack
Todas as edge functions do appjulia (`supabase/functions/*`) precisam ser reescritas como:
- `src/lib/<modulo>.functions.ts` (`createServerFn` — para chamadas internas tipadas do front)
- `src/routes/api/public/webhooks/<provider>.ts` (server routes — para webhooks externos: Asaas, MercadoPago, InfinityPay, uazapi, Meta, Instagram, ZapSign, 3CPlus, Vellip, api4com)

### Secrets / integrações a configurar quando o módulo for portado
`UAZAPI_*`, `WABA_*`, `ASAAS_*`, `MERCADOPAGO_*`, `INFINITYPAY_*`, `META_*`, `INSTAGRAM_*`, `ZAPSIGN_*`, `ADVBOX_*`, `DATAJUD_*`, `THREECPLUS_*`, `API4COM_*`, `VELLIP_*`, `DAILY_API_KEY`, AI provider keys, etc.

### Riscos conhecidos no runtime Cloudflare Workers
- Edge functions que usem `child_process`, `sharp`, `puppeteer`, `node-canvas`, `fs.watch` → precisam adaptação (lib alternativa ou chamada HTTP externa).
- JsSIP / WebRTC SIP roda no browser; backend pode precisar proxy SIP.
- Daily.co (`@daily-co/daily-js`, `@daily-co/daily-react`) → client-only.

### Vault secrets
Secrets armazenados no `vault.secrets` do projeto original NÃO foram migrados. Cada um precisa ser readicionado via `add_secret` (Lovable Cloud) quando a integração correspondente for portada.

### Lint warnings aceitos
As tabelas de chat/CRM herdam as policies permissivas `USING (true) TO authenticated` do projeto original (que não usava `auth.uid()` — usa `cod_agent` como identificador de tenant). Quando cada módulo for revisitado, recomenda-se substituir por policies baseadas em `auth.uid()` + `profiles.cod_agent`.

## Ordem sugerida das próximas fases

1. **Fase 2** — Chat/WhatsApp completo (uazapi + WABA + webhooks + mídia)
2. **Fase 3** — CRM completo (kanban + automações + copilot)
3. **Fase 4** — Agentes IA (chat-ai-*, copilot, AI provider keys)
4. **Fase 5** — Pagamentos
5. **Fase 6** — Telefonia (avaliar JsSIP)
6. **Fase 7** — Jurídico (DataJud + ZapSign)
7. **Fase 8** — Marketing (Meta Ads + Instagram)
8. **Fase 9** — Admin + push + finalizações

Diga qual módulo priorizar e a Fase 2 começa.
