# 🏛️ MEMÓRIA DO PROJETO: MARI.A

Este documento serve como a "Fonte da Verdade" para o estado atual do projeto, arquitetura e decisões técnicas.

## 🚀 Visão Geral
MarI.A é um ecossistema SaaS de luxo focado em produtividade, CRM e automação, operando sob um modelo Multi-Tenant baseado em `client_id`.

## 🏗️ Arquitetura Técnica
- **Frontend:** React + Vite + Tailwind CSS (Lux Design System)
- **Roteamento:** TanStack Router (File-based)
- **Estado/Dados:** TanStack Query + Supabase SDK
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Segurança:** RLS (Row Level Security) rigoroso por `client_id`.

## 📂 Estrutura de Módulos (Existentes)
O sistema opera com um Menu Dinâmico baseado em:
1. **Ativo no Sistema** (Tabela `modules`)
2. **Incluso no Plano** (Tabela `plan_modules`)
3. **Permissão do Usuário** (Tabela `user_permissions` ou `role_default_permissions`)

### Módulos Implementados:
- **Dashboard:** Visão geral e métricas.
- **CRM:** Boards, Pipelines e Deals.
- **Chat:** Central de atendimento e contatos.
- **Admin:** Matriz de permissões e gestão de módulos.
- **Planos (NOVO):** Gestão de pacotes com preços Mensal, Trimestral, Semestral e Anual.
- **Clientes (NOVO):** Gestão de Tenants e atribuição de planos.

## 🔐 Matriz de Perfis
- `superadmin`: Acesso total ao sistema, gestão de planos e módulos globais.
- `admin`: Administrador do cliente (Tenant).
- `time`: Usuário operacional.
- `colaborador`: Acesso restrito.

## 🎨 Identidade Visual (PMI - Motor 01)
- Estética "Lux Enterprise".
- Glassmorphism, Gradientes suaves (Linear-to-br), Animações fluidas.
- Sombras suaves e bordas arredondadas (Rounded-2xl/3xl).
