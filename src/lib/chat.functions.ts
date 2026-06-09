// Chat server functions (TanStack Start). Authenticated, RLS as user.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const listConversations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string } | undefined) =>
    z.object({ status: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context
    let q = supabase
      .from('chat_conversations')
      .select('id, protocol, status, priority, channel, opened_at, updated_at, contact:chat_contacts(id, name, phone, avatar, last_message_text, last_message_at)')
      .order('updated_at', { ascending: false })
      .limit(100)
    if (data.status) q = q.eq('status', data.status)
    const { data: rows, error } = await q
    if (error) throw new Error(error.message)
    return { conversations: rows ?? [] }
  })

export const listMessages = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string }) =>
    z.object({ conversationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', data.conversationId)
      .order('timestamp', { ascending: true })
      .limit(500)
    if (error) throw new Error(error.message)
    return { messages: messages ?? [] }
  })

export const sendMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string; text: string; internalNote?: boolean }) =>
    z
      .object({
        conversationId: z.string().uuid(),
        text: z.string().min(1).max(4000),
        internalNote: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context

    const { data: conv, error: cErr } = await supabase
      .from('chat_conversations')
      .select('id, contact_id, client_id, queue_id, status, contact:chat_contacts(phone, name)')
      .eq('id', data.conversationId)
      .maybeSingle()
    if (cErr || !conv) throw new Error('conversation not found')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    let providerStatus: 'queued' | 'sent' | 'failed' = 'queued'
    let providerError: string | null = null

    if (!data.internalNote && conv.queue_id) {
      const { data: queue } = await supabaseAdmin
        .from('queues')
        .select('evo_url, evo_apikey, evo_instance, channel_type')
        .eq('id', conv.queue_id)
        .maybeSingle()

      const contact = (conv as any).contact
      if (queue?.evo_url && queue?.evo_apikey && contact?.phone) {
        try {
          const resp = await fetch(`${queue.evo_url.replace(/\/$/, '')}/send/text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token: queue.evo_apikey,
            },
            body: JSON.stringify({
              number: contact.phone,
              text: data.text,
            }),
          })
          providerStatus = resp.ok ? 'sent' : 'failed'
          if (!resp.ok) providerError = await resp.text().catch(() => 'send failed')
        } catch (e: any) {
          providerStatus = 'failed'
          providerError = e?.message ?? 'network error'
        }
      }
    }

    const { data: inserted, error: mErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        contact_id: conv.contact_id,
        client_id: conv.client_id,
        conversation_id: conv.id,
        text: data.text,
        type: 'text',
        from_me: true,
        status: providerStatus,
        internal_note: data.internalNote ?? false,
        sender_name: 'Agente',
        metadata: { user_id: userId, provider_error: providerError },
        timestamp: new Date().toISOString(),
      } as any)
      .select('*')
      .single()
    if (mErr) throw new Error(mErr.message)

    if (conv.status === 'pending') {
      await supabaseAdmin
        .from('chat_conversations')
        .update({ status: 'open', first_response_at: new Date().toISOString() })
        .eq('id', conv.id)
    }

    return { message: inserted, providerStatus, providerError }
  })

export const listQueues = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('queues')
      .select('id, name, channel_type, phone_number, evo_instance, is_active')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { queues: data ?? [] }
  })

export const upsertQueue = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string
      client_id: string
      name: string
      evo_url?: string
      evo_apikey?: string
      evo_instance?: string
      phone_number?: string
    }) =>
      z
        .object({
          id: z.string().uuid().optional(),
          client_id: z.string().min(1),
          name: z.string().min(1),
          evo_url: z.string().url().optional(),
          evo_apikey: z.string().optional(),
          evo_instance: z.string().optional(),
          phone_number: z.string().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload: any = { ...data, channel_type: 'uazapi' }
    if (!payload.id) delete payload.id
    const { data: row, error } = await context.supabase
      .from('queues')
      .upsert(payload)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { queue: row }
  })
