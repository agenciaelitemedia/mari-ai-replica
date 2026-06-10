import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { providerSchema, generateRandomKey, type ProviderType } from './providers.types'

async function getUserClientId(supabase: any, userId: string): Promise<string | null> {
  const { data: profile } = await supabase.from('profiles').select('client_id, email').eq('id', userId).maybeSingle()
  if (profile?.client_id) return profile.client_id
  if (profile?.email) {
    const { data: client } = await supabase.from('clients').select('id').eq('email', profile.email).maybeSingle()
    if (client) return client.id
  }
  return null
}

async function isSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  return (data ?? []).some((r: any) => r.role === 'superadmin')
}

async function resolveClientLimit(supabaseAdmin: any, clientId: string): Promise<number> {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('settings, plan_id')
    .eq('id', clientId)
    .maybeSingle()

  // 1. Client override
  if (client?.settings && typeof client.settings === 'object') {
    const v = Number((client.settings as any).queues_count || (client.settings as any).QUEUE_LIMIT || 0)
    if (v > 0) return v
  }
  // 2. Plan
  if (client?.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('settings')
      .eq('id', client.plan_id)
      .maybeSingle()
    const v = Number((plan?.settings as any)?.queues_count ?? 0)
    if (v > 0) return v
  }
  // 3. Default (igual appjulia)
  return 1
}

export const listProviders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { type?: ProviderType } | undefined) =>
    z.object({ type: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    let q = supabaseAdmin.from('queue_providers').select('*').order('created_at', { ascending: false })
    if (data.type) q = q.eq('provider_type', data.type)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return { providers: rows ?? [] }
  })

export const upsertProvider = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => providerSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    if (!superadmin) throw new Error('Apenas superadmin pode gerenciar provedores')

    const payload: any = { ...data, client_id: null }
    if (!payload.id) delete payload.id
    if (payload.provider_type === 'webchat' && !payload.widget_key) {
      payload.widget_key = generateRandomKey('wc')
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row, error } = await supabaseAdmin
      .from('queue_providers')
      .upsert(payload)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { provider: row }
  })

export const deleteProvider = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    if (!superadmin) throw new Error('Apenas superadmin pode excluir provedores')
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: linked } = await supabaseAdmin
      .from('queues')
      .select('id, name')
      .eq('provider_id', data.id)
      .eq('is_deleted', false)
    if ((linked ?? []).length > 0) {
      throw new Error(`Provedor possui ${linked!.length} fila(s) vinculada(s): ${linked!.map((q: any) => q.name).join(', ')}`)
    }

    const { error } = await supabaseAdmin.from('queue_providers').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const testProvider = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: p } = await supabaseAdmin.from('queue_providers').select('*').eq('id', data.id).maybeSingle()
    if (!p) throw new Error('Provedor não encontrado')

    try {
      if (p.provider_type === 'uazapi') {
        const r = await fetch(`${(p.evo_url ?? '').replace(/\/$/, '')}/instance/all`, {
          headers: { admintoken: p.evo_apikey ?? '' },
        })
        return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') }
      }
      if (p.provider_type === 'waba') {
        const r = await fetch(`https://graph.facebook.com/v20.0/${p.waba_business_id}`, {
          headers: { Authorization: `Bearer ${p.waba_token}` },
        })
        return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') }
      }
      if (p.provider_type === 'instagram') {
        const r = await fetch(`https://graph.facebook.com/v20.0/${p.instagram_user_id}`, {
          headers: { Authorization: `Bearer ${p.page_access_token}` },
        })
        return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') }
      }
      if (p.provider_type === 'webchat') {
        return { ok: true, status: 200, body: `widget_key: ${p.widget_key}` }
      }
      return { ok: false, status: 0, body: 'tipo desconhecido' }
    } catch (e: any) {
      return { ok: false, status: 0, body: e?.message ?? 'erro' }
    }
  })


// ============ Queues ============

const createQueueSchema = z.object({
  name: z.string().min(1).max(120),
  channel_type: z.enum(['uazapi', 'waba', 'instagram', 'webchat']),
  provider_id: z.string().uuid().nullable().optional(),
  evo_instance: z.string().nullable().optional(),
  // WABA per-queue credentials
  waba_token: z.string().nullable().optional(),
  waba_id: z.string().nullable().optional(),
  waba_number_id: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  settings: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
})

const updateQueueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  evo_instance: z.string().nullable().optional(),
  waba_token: z.string().nullable().optional(),
  waba_id: z.string().nullable().optional(),
  waba_number_id: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  settings: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
})

export const listQueuesFull = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { include_deleted?: boolean } | undefined) =>
    z.object({ include_deleted: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    let q = supabaseAdmin
      .from('queues')
      .select('*, provider:queue_providers(id, name, provider_type, is_active)')
      .order('created_at', { ascending: false })

    if (!data.include_deleted) q = q.eq('is_deleted', false)

    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (!cid) return { queues: [] }
      q = q.eq('client_id', cid)
    }
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return { queues: rows ?? [] }
  })

export const createQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createQueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const clientId = await getUserClientId(supabase, userId)
    if (!clientId) throw new Error('Usuário sem cliente associado')
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    // Limit enforcement (default 1)
    const limit = await resolveClientLimit(supabaseAdmin, clientId)
    const { count } = await supabaseAdmin
      .from('queues')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_deleted', false)
    if ((count ?? 0) >= limit) {
      throw new Error(`Limite de filas atingido (${limit}). Contrate filas adicionais para criar mais.`)
    }

    // Snapshot provider credentials when present (non-WABA)
    let snapshot: Record<string, any> = {}
    if (data.provider_id) {
      const { data: prov } = await supabaseAdmin
        .from('queue_providers')
        .select('*')
        .eq('id', data.provider_id)
        .maybeSingle()
      if (!prov) throw new Error('Provedor não encontrado')
      if (!prov.is_active) throw new Error('Provedor está inativo')
      snapshot = {
        evo_url: prov.evo_url,
        evo_apikey: prov.evo_apikey,
        metadata: { provider_snapshot: { type: prov.provider_type, name: prov.name } },
      }
    }

    const payload: any = {
      client_id: clientId,
      provider_id: data.provider_id ?? null,
      name: data.name,
      channel_type: data.channel_type,
      evo_instance: data.evo_instance ?? null,
      waba_token: data.waba_token ?? null,
      waba_id: data.waba_id ?? null,
      waba_number_id: data.waba_number_id ?? null,
      phone_number: data.phone_number ?? null,
      is_active: data.is_active,
      settings: data.settings ?? {},
      ...snapshot,
    }

    const { data: row, error } = await supabaseAdmin.from('queues').insert(payload).select('*').single()
    if (error) throw new Error(error.message)
    return { queue: row }
  })

export const updateQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateQueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: existing } = await supabaseAdmin
      .from('queues')
      .select('client_id')
      .eq('id', data.id)
      .maybeSingle()
    if (!existing) throw new Error('Fila não encontrada')
    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (cid !== existing.client_id) throw new Error('Sem permissão')
    }

    const { id, ...fields } = data
    const payload: Record<string, any> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) payload[k] = v
    }

    const { data: row, error } = await supabaseAdmin
      .from('queues')
      .update(payload as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { queue: row }
  })

export const countActiveConversations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { queue_id: string }) =>
    z.object({ queue_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { count } = await supabaseAdmin
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('queue_id', data.queue_id)
      .not('status', 'in', '(resolved,closed)')
    return { count: count ?? 0 }
  })

export const deleteQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      queue_id: z.string().uuid(),
      migrate_to_queue_id: z.string().uuid().optional(),
      force: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: q } = await supabaseAdmin.from('queues').select('client_id').eq('id', data.queue_id).maybeSingle()
    if (!q) throw new Error('Fila não encontrada')
    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (cid !== q.client_id) throw new Error('Sem permissão')
    }

    // Count active conversations
    const { count: activeCount } = await supabaseAdmin
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('queue_id', data.queue_id)
      .not('status', 'in', '(resolved,closed)')

    const hasActive = (activeCount ?? 0) > 0

    if (hasActive && !data.migrate_to_queue_id && !data.force) {
      throw new Error('Existem conversas ativas nesta fila. Selecione uma fila destino ou marque "Excluir sem migrar".')
    }

    if (data.migrate_to_queue_id && hasActive) {
      const { error: mErr } = await supabaseAdmin
        .from('chat_conversations')
        .update({ queue_id: data.migrate_to_queue_id })
        .eq('queue_id', data.queue_id)
        .not('status', 'in', '(resolved,closed)')
      if (mErr) throw new Error('Falha ao migrar conversas: ' + mErr.message)
    }

    const { error } = await supabaseAdmin
      .from('queues')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', data.queue_id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const restoreQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      queue_id: z.string().uuid(),
      migrate_to_queue_id: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: q } = await supabaseAdmin.from('queues').select('client_id').eq('id', data.queue_id).maybeSingle()
    if (!q) throw new Error('Fila não encontrada')
    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (cid !== q.client_id) throw new Error('Sem permissão')
    }

    // Enforce limit on restore
    const limit = await resolveClientLimit(supabaseAdmin, q.client_id)
    const { count } = await supabaseAdmin
      .from('queues')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', q.client_id)
      .eq('is_deleted', false)
    if ((count ?? 0) >= limit) {
      throw new Error(`Limite de filas atingido (${limit}). Exclua uma fila ativa antes de restaurar.`)
    }

    const { error } = await supabaseAdmin
      .from('queues')
      .update({ is_deleted: false, deleted_at: null, is_active: true })
      .eq('id', data.queue_id)
    if (error) throw new Error(error.message)

    if (data.migrate_to_queue_id) {
      const { error: mErr } = await supabaseAdmin
        .from('chat_conversations')
        .update({ queue_id: data.queue_id })
        .eq('queue_id', data.migrate_to_queue_id)
        .not('status', 'in', '(resolved,closed)')
      if (mErr) throw new Error('Fila restaurada, mas falha ao migrar conversas: ' + mErr.message)
    }

    return { ok: true }
  })

export const listClientsForSelect = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    let q = supabaseAdmin.from('clients').select('id, name').eq('is_active', true).order('name')
    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (!cid) return { clients: [] }
      q = q.eq('id', cid)
    }
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return { clients: data ?? [] }
  })

export const getQueuesUsage = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context
    const clientId = await getUserClientId(supabase, userId)
    if (!clientId) return { current: 0, limit: 1 }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const limit = await resolveClientLimit(supabaseAdmin, clientId)

    const { count } = await supabaseAdmin
      .from('queues')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_deleted', false)

    return { current: count ?? 0, limit }
  })
