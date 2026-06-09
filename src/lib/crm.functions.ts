// CRM server functions (TanStack Start). Authenticated, RLS as user.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const CLIENT_ID_FALLBACK = 'default'

async function getCodAgent(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('cod_agent')
    .eq('id', userId)
    .maybeSingle()
  return data?.cod_agent ?? userId
}

export const listBoards = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('crm_boards')
      .select('id, name, description, color, icon, position, is_archived')
      .eq('is_archived', false)
      .order('position', { ascending: true })
    if (error) throw new Error(error.message)
    return { boards: data ?? [] }
  })

export const createBoard = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; description?: string; color?: string }) =>
    z
      .object({
        name: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        color: z.string().max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const cod = await getCodAgent(context.supabase, context.userId)
    const { data: maxRow } = await context.supabase
      .from('crm_boards')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = (maxRow?.position ?? -1) + 1

    const { data: board, error } = await context.supabase
      .from('crm_boards')
      .insert({
        cod_agent: cod,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? '#6366f1',
        position,
        is_archived: false,
        created_by: context.userId,
      } as any)
      .select('*')
      .single()
    if (error) throw new Error(error.message)

    // Default pipelines (stages)
    const defaults = [
      { name: 'Novo', color: '#94a3b8', position: 0, win_probability: 10 },
      { name: 'Qualificação', color: '#3b82f6', position: 1, win_probability: 30 },
      { name: 'Proposta', color: '#f59e0b', position: 2, win_probability: 60 },
      { name: 'Negociação', color: '#a855f7', position: 3, win_probability: 80 },
      { name: 'Ganho', color: '#22c55e', position: 4, win_probability: 100 },
      { name: 'Perdido', color: '#ef4444', position: 5, win_probability: 0 },
    ]
    await context.supabase.from('crm_pipelines').insert(
      defaults.map((p) => ({
        board_id: board.id,
        cod_agent: cod,
        ...p,
        is_active: true,
      })) as any,
    )

    return { board }
  })

export const getBoardData = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { boardId: string }) =>
    z.object({ boardId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const [pipesRes, dealsRes] = await Promise.all([
      context.supabase
        .from('crm_pipelines')
        .select('id, name, color, position, win_probability, is_active')
        .eq('board_id', data.boardId)
        .eq('is_active', true)
        .order('position', { ascending: true }),
      context.supabase
        .from('crm_deals')
        .select(
          'id, pipeline_id, title, description, value, currency, contact_name, contact_phone, priority, status, position, expected_close_date, tags, conversation_id, contact_id, updated_at',
        )
        .eq('board_id', data.boardId)
        .order('position', { ascending: true }),
    ])
    if (pipesRes.error) throw new Error(pipesRes.error.message)
    if (dealsRes.error) throw new Error(dealsRes.error.message)
    return { pipelines: pipesRes.data ?? [], deals: dealsRes.data ?? [] }
  })

export const createDeal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      boardId: string
      pipelineId: string
      title: string
      value?: number
      contactName?: string
      contactPhone?: string
      conversationId?: string
      contactId?: string
    }) =>
      z
        .object({
          boardId: z.string().uuid(),
          pipelineId: z.string().uuid(),
          title: z.string().min(1).max(200),
          value: z.number().nonnegative().optional(),
          contactName: z.string().max(200).optional(),
          contactPhone: z.string().max(40).optional(),
          conversationId: z.string().uuid().optional(),
          contactId: z.string().uuid().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const cod = await getCodAgent(context.supabase, context.userId)
    const { data: maxRow } = await context.supabase
      .from('crm_deals')
      .select('position')
      .eq('pipeline_id', data.pipelineId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = (maxRow?.position ?? -1) + 1

    const { data: deal, error } = await context.supabase
      .from('crm_deals')
      .insert({
        board_id: data.boardId,
        pipeline_id: data.pipelineId,
        cod_agent: cod,
        title: data.title,
        value: data.value ?? 0,
        currency: 'BRL',
        contact_name: data.contactName ?? null,
        contact_phone: data.contactPhone ?? null,
        conversation_id: data.conversationId ?? null,
        contact_id: data.contactId ?? null,
        priority: 'medium',
        status: 'open',
        position,
        stage_entered_at: new Date().toISOString(),
        created_by: context.userId,
      } as any)
      .select('*')
      .single()
    if (error) throw new Error(error.message)

    await context.supabase.from('crm_deal_history').insert({
      deal_id: deal.id,
      action: 'created',
      to_pipeline_id: data.pipelineId,
      changed_by: context.userId,
    } as any)

    return { deal }
  })

export const moveDeal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { dealId: string; toPipelineId: string; toPosition: number }) =>
      z
        .object({
          dealId: z.string().uuid(),
          toPipelineId: z.string().uuid(),
          toPosition: z.number().int().nonnegative(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: current, error: e1 } = await context.supabase
      .from('crm_deals')
      .select('id, pipeline_id, position, board_id')
      .eq('id', data.dealId)
      .maybeSingle()
    if (e1 || !current) throw new Error('deal not found')

    const { error } = await context.supabase
      .from('crm_deals')
      .update({
        pipeline_id: data.toPipelineId,
        position: data.toPosition,
        stage_entered_at:
          current.pipeline_id !== data.toPipelineId ? new Date().toISOString() : undefined,
      } as any)
      .eq('id', data.dealId)
    if (error) throw new Error(error.message)

    if (current.pipeline_id !== data.toPipelineId) {
      await context.supabase.from('crm_deal_history').insert({
        deal_id: data.dealId,
        action: 'moved',
        from_pipeline_id: current.pipeline_id,
        to_pipeline_id: data.toPipelineId,
        changed_by: context.userId,
      } as any)
    }

    return { ok: true }
  })

export const linkConversationToDeal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { conversationId: string; boardId: string; pipelineId: string; title?: string }) =>
      z
        .object({
          conversationId: z.string().uuid(),
          boardId: z.string().uuid(),
          pipelineId: z.string().uuid(),
          title: z.string().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from('crm_deals')
      .select('id')
      .eq('conversation_id', data.conversationId)
      .maybeSingle()
    if (existing) return { deal: existing, reused: true }

    const { data: conv, error: cErr } = await context.supabase
      .from('chat_conversations')
      .select('id, contact_id, contact:chat_contacts(name, phone)')
      .eq('id', data.conversationId)
      .maybeSingle()
    if (cErr || !conv) throw new Error('conversation not found')

    const cod = await getCodAgent(context.supabase, context.userId)
    const contact = (conv as any).contact
    const title = data.title ?? `Negócio — ${contact?.name ?? contact?.phone ?? 'Conversa'}`

    const { data: maxRow } = await context.supabase
      .from('crm_deals')
      .select('position')
      .eq('pipeline_id', data.pipelineId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = (maxRow?.position ?? -1) + 1

    const { data: deal, error } = await context.supabase
      .from('crm_deals')
      .insert({
        board_id: data.boardId,
        pipeline_id: data.pipelineId,
        cod_agent: cod,
        title,
        value: 0,
        currency: 'BRL',
        contact_id: conv.contact_id,
        conversation_id: conv.id,
        contact_name: contact?.name ?? null,
        contact_phone: contact?.phone ?? null,
        priority: 'medium',
        status: 'open',
        position,
        stage_entered_at: new Date().toISOString(),
        created_by: context.userId,
      } as any)
      .select('*')
      .single()
    if (error) throw new Error(error.message)

    return { deal, reused: false }
  })
