# 🗓️ LOG DE EVOLUÇÃO (TIME-LINE)

Rastreamento cronológico de implementações e mudanças críticas.

## [2026-06-09] - Expansão SaaS e Gestão de Planos
- **Gestão de Clientes:** Implementada nova tela de criação/edição de clientes com estrutura de abas (Dados, Planos, Config, Usuário).
- **Flexibilidade:** Adicionado campo `settings` (JSONB) na tabela `clients` para configurações dinâmicas.
- **Arquitetura SaaS:** Implementação das tabelas `plans` e `plan_modules`.
- **Preços Multi-Período:** Adicionados campos `price_quarterly`, `price_semiannual` e `price_annual`.
- **Páginas Independentes:** Migração das funcionalidades de Admin para rotas dedicadas (`/plans` e `/clients`).
- **Navegação Dinâmica:** Menu lateral agora filtra módulos por Plano + Permissão.

## [Anterior] - Refatoração UI/UX e Performance
- **Luxury UI:** Aplicação do protocolo de design sênior em todo o sistema.
- **Lighthouse Opt:** Melhorias de performance, skeleton loading e otimização de imagens.
- **Correção de Menu:** Ajuste no hook `useMenuModules` para garantir carregamento instantâneo.
