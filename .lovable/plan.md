# Plano: migrar appjulia → MarI.A (TanStack Start)

## Contexto

- **Origem** (`agenciaelitemedia/appjulia`): Vite + React 18 + React Router DOM + Tailwind v3 + shadcn. 50 áreas de páginas, ~80 hooks/contextos, **235 migrations SQL**, **90 Edge Functions** Supabase.
- **Destino** (este projeto): TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + Cloudflare Workers + Lovable Cloud (Supabase gerenciado).
- Os dois stacks são **incompatíveis**. Tudo precisa ser portado, não simplesmente copiado.

Por isso a migração será feita **em fases**. Esta sessão executa a **Fase 1**. Fases 2+ ficam para sessões seguintes, conforme você priorizar módulos.

---

## Fase 1 — Fundação (esta sessão)

### 1. Habilitar Lovable Cloud

Provisiona Supabase gerenciado, gera `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, monta o cliente em `src/integrations/supabase/`.

### 2. Aplicar as 235 migrations no novo banco

- Concatenar `/tmp/appjulia/supabase/migrations/*.sql` em ordem cronológica.
- Aplicar via tool de migration em lotes (algumas migrations referenciam `auth.users` e extensões — vou habilitar `pgcrypto`, `uuid-ossp`, `pg_cron`, `pg_net`, `vector` se presentes).
- Para cada `CREATE TABLE` no schema `public` sem GRANTs explícitos, adicionar GRANT block (`authenticated` + `service_role`; `anon` só onde houver política permissiva).
- Migrations que dependem de secrets/configs específicas (ex: `vault.create_secret`) serão adaptadas ou ignoradas com nota.
- Migrations que criam Edge Function triggers via `pg_net` serão mantidas mas apontarão para URLs `/api/...` do TanStack quando a function correspondente for portada.

### 3. Autenticação

- Habilitar email/password sem Google OAuth .
- Criar layout `src/routes/_authenticated/route.tsx` (gate `ssr:false` + `getUser`).
- Criar `src/routes/auth.tsx` com tela de login/cadastro.
- Wirar `attachSupabaseAuth` em `src/start.ts` e `onAuthStateChange` em `__root.tsx`.

### 4. Shell e navegação (esqueleto)

- `src/routes/_authenticated/route.tsx` com sidebar + topbar baseado no shell do appjulia (`src/components/Layout` adaptado a Tailwind v4 + shadcn novo).
- Páginas-stub para os módulos principais (apenas rota + título + "em construção"):
  - `/dashboard`
  - `/chat` (WhatsApp/atendimento)
  - `/crm` (leads + funil)
  - `/contatos`
  - `/agentes` (IA)
  - `/configuracoes`
  - `/equipe`
  - `/comercial`
  - `/criativos`
  - `/legal-cases` (jurídico/DataJud/ZapSign)
  - `/telefonia` (filas + JsSIP — placeholder, integração WebRTC fica para fase posterior)
  - `/admin`

### 5. Assets e tema

- Copiar `public/` e `src/assets/` do appjulia.
- Migrar paleta/tokens do `src/index.css` antigo para `src/styles.css` (Tailwind v4 `@theme inline` com `oklch`). Manter identidade visual.

### 6. Estrutura de pastas para fases futuras

- `src/lib/<modulo>.functions.ts` — server fns (substituem edge functions).
- `src/lib/<modulo>.server.ts` — helpers server-only.
- `src/routes/api/public/webhooks/<provider>.ts` — webhooks externos (Asaas, MercadoPago, InfinityPay, uazapi, Meta, Instagram, ZapSign, etc.).
- README documentando o mapeamento "edge function antiga → server fn nova".

### 7. README de migração

Arquivo `MIGRATION.md` listando:

- O que foi portado nesta fase.
- Lista das ~90 edge functions com status (TODO).
- Lista de integrações e secrets que ainda precisarão ser configurados.
- Riscos conhecidos (JsSIP no Worker, Daily.co server-side, `child_process` em algumas functions).

---

## Fases futuras (não nesta sessão)

Cada uma vira sessão própria quando você priorizar. Ordem sugerida:

- **Fase 2** — Chat/WhatsApp (uazapi + WABA + webhooks + mídia). Maior módulo.
- **Fase 3** — CRM (leads, kanban, automações, copilot).
- **Fase 4** — Agentes IA (chat-ai-assist, copilot, prompt-generator, AI provider keys).
- **Fase 5** — Pagamentos (Asaas, MercadoPago, InfinityPay, checkouts e webhooks).
- **Fase 6** — Telefonia (filas, 3CPlus, api4com, Vellip — JsSIP precisa avaliação de compat).
- **Fase 7** — Jurídico (DataJud, ZapSign, contratos, ADVBox).
- **Fase 8** — Marketing (Meta Ads, Instagram, criativos, campanhas).
- **Fase 9** — Admin, equipe, configurações finais, push notifications.

---

## Riscos a registrar

- **Cloudflare Workers** não roda `child_process`, `sharp`, `puppeteer`, `node-canvas`. Algumas edge functions do appjulia podem usá-los — vou marcar como "precisa adaptação" no MIGRATION.md.
- **JsSIP / WebRTC SIP** é client-side e pesado; provavelmente funcionará no browser mas a sinalização pode precisar de proxy.
- `**pg_cron` + `pg_net**` continuarão funcionando, mas URLs precisarão apontar para `https://project--{id}.lovable.app/api/...` após cada function ser portada.
- Não migro `vault.*` secrets do projeto Supabase original (você terá que readicionar as chaves quando cada integração for portada).

---

## Entregável desta sessão

Projeto MarI.A com:

- Banco Lovable Cloud com schema completo do appjulia aplicado.
- Login/cadastro funcionando.
- Layout autenticado navegável com stubs para todos os módulos.
- Assets e identidade visual transplantados.
- `MIGRATION.md` mapeando o que falta.

Quando aprovar, executo a Fase 1. Diz qual módulo quer priorizar depois e seguimos.