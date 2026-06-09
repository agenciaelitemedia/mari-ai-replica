Refactor the Queues (Filas) module to match the appjulia pattern, including limit checks, global provider integration, and a premium UI/UX.

### Database & Logic (Backend)
- **Limit Logic:** Update `upsertQueueFull` to check `queues_count` from `client.settings` (override) or `plan.settings` (default).
- **New Server Function:** Implement `getQueuesUsage` in `providers.functions.ts` to return current active queues vs plan limit.
- **Isolate by client_id:** Ensure all queue operations strictly use the user's `client_id`.

### Frontend & UI
- **QueueCard Component:** Create `src/components/admin/queues/QueueCard.tsx` with:
  - Status indicator (Ativa/Inativa).
  - Channel icon (WhatsApp, Instagram, etc.).
  - Quick actions (Edit, Delete).
  - Provider name and phone/identifier.
- **QueuesList Refactor:** 
  - Switch to a grid/list of `QueueCard`.
  - Add a "Plan Usage" header showing "X of Y queues used".
- **QueueDialog Refactor:**
  - Modernize layout with clean inputs and grouping.
  - Show "Saudação" (Welcome message) as a clear section.
- **Route Update:** Refactor `src/routes/_authenticated/queues.tsx` to integrate usage stats and the new list style.

### Refinement Rules
- Keep `client_id` automatic from the authenticated session.
- Only show "Provedores" that are active.
- Use `SweetAlert2` for all deletions.
