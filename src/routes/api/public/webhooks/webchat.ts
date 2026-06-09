// Webchat widget webhook
// URL: /api/public/webhooks/webchat?key={widget_key}
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const bodySchema = z.object({
  visitor_id: z.string().min(1).max(120),
  name: z.string().max(120).optional(),
  message: z.string().min(1).max(4000),
})

export const Route = createFileRoute('/api/public/webhooks/webchat')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const key = url.searchParams.get('key')
          if (!key) return Response.json({ error: 'key required' }, { status: 400, headers: CORS })

          const json = await request.json().catch(() => ({}))
          const data = bodySchema.parse(json)

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: prov } = await supabaseAdmin
            .from('queue_providers')
            .select('id, client_id, is_active, allowed_origins')
            .eq('widget_key', key)
            .maybeSingle()
          if (!prov || !prov.is_active) return Response.json({ error: 'invalid key' }, { status: 401, headers: CORS })

          const origin = request.headers.get('origin') ?? ''
          if (prov.allowed_origins && prov.allowed_origins.length > 0 && origin) {
            if (!prov.allowed_origins.some((o: string) => o === origin || origin.endsWith(o))) {
              return Response.json({ error: 'origin not allowed' }, { status: 403, headers: CORS })
            }
          }

          const { data: queue } = await supabaseAdmin
            .from('queues')
            .select('id, client_id')
            .eq('provider_id', prov.id)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle()
          if (!queue) return Response.json({ ok: true, ignored: 'no queue' }, { headers: CORS })

          const phone = `web_${data.visitor_id}`
          await supabaseAdmin
            .from('chat_contacts')
            .upsert(
              {
                client_id: queue.client_id,
                phone,
                name: data.name ?? data.visitor_id,
                last_message_at: new Date().toISOString(),
                last_message_text: data.message.slice(0, 200),
              },
              { onConflict: 'client_id,phone' as any },
            )
          const { data: c } = await supabaseAdmin
            .from('chat_contacts')
            .select('id')
            .eq('client_id', queue.client_id)
            .eq('phone', phone)
            .maybeSingle()
          if (!c) return Response.json({ error: 'contact failed' }, { status: 500, headers: CORS })

          let { data: conv } = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('contact_id', c.id)
            .in('status', ['pending', 'open', 'in_progress'])
            .limit(1)
            .maybeSingle()
          if (!conv) {
            const { data: created } = await supabaseAdmin
              .from('chat_conversations')
              .insert({
                contact_id: c.id,
                client_id: queue.client_id,
                channel: 'webchat',
                status: 'pending',
                protocol: '',
                queue_id: queue.id,
              } as any)
              .select('id')
              .single()
            conv = created
          }

          await supabaseAdmin.from('chat_messages').insert({
            contact_id: c.id,
            client_id: queue.client_id,
            conversation_id: conv?.id ?? null,
            text: data.message,
            type: 'text',
            from_me: false,
            status: 'received',
            sender_name: data.name ?? data.visitor_id,
            metadata: { visitor_id: data.visitor_id, origin },
            timestamp: new Date().toISOString(),
          } as any)

          return Response.json({ ok: true, conversation_id: conv?.id }, { headers: CORS })
        } catch (e: any) {
          console.error('[webchat-webhook]', e)
          return Response.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: CORS })
        }
      },
    },
  },
})
