## Problema

Na etapa "Módulos" do wizard de criação/edição de plano, clicar no card ou no checkbox não marca nada. A causa é um **duplo disparo**: o `onClick` do card e o `onCheckedChange` do `Checkbox` são acionados no mesmo clique (o evento sobe do checkbox para o card), alternando o valor duas vezes — resultado líquido: nenhuma mudança.

## Correção

Editar apenas `src/components/admin/planos/PlanDialog.tsx`, na renderização dos cards de módulo (etapa "Módulos"):

1. **Manter o `onClick` apenas no card** como único responsável por alternar a seleção.
2. **Tornar o `Checkbox` inerte ao clique**, deixando-o como indicador visual:
   - Remover o `onCheckedChange={() => toggleModule(mod.id)}` que foi adicionado.
   - Adicionar `className="pointer-events-none"` e `tabIndex={-1}` ao Checkbox.
3. Garantir que `checked` continue lendo via `form.watch('module_ids')` para re-render imediato.
4. Confirmar que `toggleModule` usa `form.getValues` (estado fresco) e `form.setValue(..., { shouldValidate: true, shouldDirty: true })`.

Nada mais muda: o botão "Selecionar Todos / Desmarcar Todos" por categoria, o contador no topo, a validação mínima de 1 módulo e a persistência em `plan_modules` permanecem como estão.

## Verificação

Após a edição, abrir o wizard, avançar até a etapa Módulos e validar:
- Clicar no card marca/desmarca uma única vez.
- Clicar diretamente sobre o ícone do checkbox também marca uma única vez (via bubble para o card).
- Contador no topo reflete a quantidade real.
- Botão "Selecionar Todos" continua funcionando.
- Salvar persiste todos os módulos escolhidos no plano.