## Objetivo
Refinar a UI do sistema para se aproximar do template **Modernize** (adminmart), mantendo 100% do comportamento atual dos componentes (rotas, formulários, wizards, dialogs, auth, etc.).

## Características visuais do Modernize a aplicar
- **Paleta**: fundo levemente azulado (#f6f9fc), cards brancos puros, primário azul/ciano vibrante (#5D87FF), secundário ciano (#49BEFF), success/warning/error suaves em pastel.
- **Tipografia**: sans-serif moderna (Plus Jakarta Sans), pesos 500/600/700, títulos médios, sem uppercase agressivo.
- **Sidebar**: largura ~270px, fundo branco, itens com `border-radius` pill (rounded-full no item ativo), ícone + label, item ativo com fundo primário sólido e texto branco. Grupos com label cinza pequeno.
- **Topbar**: header branco fixo com sombra sutil, busca, notificações, avatar do usuário (substitui o avatar no rodapé da sidebar).
- **Cards**: brancos, `rounded-xl`, sombra muito suave (`shadow-sm`), sem glass/blur.
- **Botões**: `rounded-md`, sem gradiente, sombra leve, hover apenas em opacidade.
- **Tabelas**: linhas com bastante padding vertical, header sem fundo, divisores muito sutis.
- **Badges**: pastel (bg-primary/10 + text-primary), `rounded-md`, normal-case.
- **Dashboard**: cards de stats coloridos pastel (azul, ciano, laranja, verde) com ícone grande à esquerda e número à direita.

## Arquivos a modificar (apenas estilo/classes, sem mudar lógica)

### 1. Design tokens — `src/styles.css`
- Atualizar `:root` com paleta Modernize (primary `#5D87FF`, secondary `#49BEFF`, background `#f6f9fc`, sidebar branco, etc.).
- Importar fonte **Plus Jakarta Sans** via `<link>` em `src/routes/__root.tsx`.
- Aplicar `font-family` no body.

### 2. Layout principal — `src/routes/_authenticated/route.tsx`
- Sidebar: fundo branco, largura 270px, itens com pill ativo (bg primário sólido, texto branco, `rounded-full`), itens inativos cinza.
- Adicionar **topbar branca fixa** acima do conteúdo (desktop + mobile) com: toggle sidebar, busca opcional, avatar+menu do usuário (mover do rodapé da sidebar pra cá).
- Remover o card de perfil do rodapé da sidebar (mover para dropdown no topbar).
- Fundo principal: `bg-[#f6f9fc]`.

### 3. Componentes UI base (apenas classes)
- `card.tsx`: `rounded-xl`, `shadow-sm`, sem backdrop-blur.
- `button.tsx`: ajustar `default` para cor sólida sem gradiente, `rounded-md`.
- `input.tsx`: `rounded-md`, borda mais suave.
- `badge.tsx`: variantes pastel.
- `tabs.tsx`, `dialog.tsx`, `table.tsx`: refinamento de espaçamentos/raios.

### 4. Dashboard — `src/routes/_authenticated/dashboard.tsx`
- Adicionar linha de **stat cards pastel** (Atendimentos, Clientes, Receita, Conversão) com ícone à esquerda.
- Cards de módulos com visual Modernize (ícone em quadrado pastel, título, descrição).
- Remover gradientes/blur restantes.

## O que NÃO muda
- Nenhuma rota, server function, hook, validação, lógica de wizard, lógica de modal, lógica de confirmação, queries, estado.
- Estrutura de componentes (props, children, eventos) permanece idêntica.
- Comportamento de auth, planos, módulos, clientes intacto.

## Validação
- Abrir preview e revisar: dashboard, lista de planos, wizard de plano, lista de clientes, dialog de confirmação.
- Verificar responsivo mobile (sidebar drawer + topbar).
