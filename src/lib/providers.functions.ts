import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { providerSchema, generateRandomKey, type ProviderType } from './providers.types'

async function getUserClientId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('client_id').eq('id', userId).maybeSingle()
  return data?.client_id ?? null
}

async function isSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  return (data ?? []).some((r: any) => r.role === 'superadmin')
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

const queueSchema = z.object({
  id: z.string().uuid().optional(),
  provider_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  phone_number: z.string().optional(),
  settings: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
})

export const listQueuesFull = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    let q = supabaseAdmin
      .from('queues')
      .select('*, provider:queue_providers(id, name, provider_type, is_active)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (!cid) return { queues: [] }
      q = q.eq('client_id', cid)
    }
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return { queues: rows ?? [] }
  })

export const upsertQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => queueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const clientId = await getUserClientId(supabase, userId)
    if (!clientId) throw new Error('Usuário sem cliente associado')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    // Load provider for snapshot + channel_type
    const { data: prov } = await supabaseAdmin
      .from('queue_providers')
      .select('*')
      .eq('id', data.provider_id)
      .maybeSingle()
    if (!prov) throw new Error('Provedor não encontrado')
    if (!prov.is_active) throw new Error('Provedor está inativo')

    // Plan limit check on create
    if (!data.id) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('settings, plan_id')
        .eq('id', clientId)
        .maybeSingle()
      
      let limit = 0
      // 1. Check client.settings (override)
      if (client?.settings && typeof client.settings === 'object') {
        limit = Number((client.settings as any).queues_count || 0)
      }

      // 2. Check plan.settings if no client override
      if (limit === 0 && client?.plan_id) {
        const { data: plan } = await supabaseAdmin
          .from('plans')
          .select('settings')
          .eq('id', client.plan_id)
          .maybeSingle()
        limit = Number((plan?.settings as any)?.queues_count ?? 0)
      }

      if (limit > 0) {
        const { count } = await supabaseAdmin
          .from('queues')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('is_deleted', false)
        if ((count ?? 0) >= limit) {
          throw new Error(`Limite do plano atingido (${limit} fila(s))`)
        }
      }
    }

    const payload: any = {
      client_id: clientId,
      provider_id: data.provider_id,
      name: data.name,
      phone_number: data.phone_number ?? null,
      channel_type: prov.provider_type,
      evo_url: prov.evo_url,
      evo_apikey: prov.evo_apikey,
      waba_id: prov.waba_business_id,
      waba_token: prov.waba_token,
      is_active: data.is_active,
      settings: data.settings ?? {},
      metadata: { provider_snapshot: { type: prov.provider_type, name: prov.name } },
    }

    if (data.id) payload.id = data.id

    const { data: row, error } = await supabaseAdmin.from('queues').upsert(payload).select('*').single()
    if (error) throw new Error(error.message)
    return { queue: row }
  })


export const deleteQueueFull = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    const superadmin = await isSuperAdmin(supabase, userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: q } = await supabaseAdmin.from('queues').select('client_id').eq('id', data.id).maybeSingle()
    if (!q) throw new Error('Fila não encontrada')
    if (!superadmin) {
      const cid = await getUserClientId(supabase, userId)
      if (cid !== q.client_id) throw new Error('Sem permissão')
    }
    const { error } = await supabaseAdmin
      .from('queues')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
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
    if (!clientId) return { current: 0, limit: 0 }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    
    // Get limit
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('settings, plan_id')
      .eq('id', clientId)
      .maybeSingle()
    
    let limit = 0
    if (client?.settings && typeof client.settings === 'object') {
      limit = Number((client.settings as any).queues_count || 0)
    }
    if (limit === 0 && client?.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('settings')
        .eq('id', client.plan_id)
        .maybeSingle()
      limit = Number((plan?.settings as any)?.queues_count ?? 0)
    }

    // Get current count
    const { count } = await supabaseAdmin
      .from('queues')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_deleted', false)

    return { current: count ?? 0, limit }
  })
