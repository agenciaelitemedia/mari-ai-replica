// Instagram Messaging webhook (Meta)
// URL: /api/public/webhooks/instagram?provider_id={id}
import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const Route = createFileRoute('/api/public/webhooks/instagram')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const providerId = url.searchParams.get('provider_id')
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')
        if (!providerId) return new Response('missing provider_id', { status: 400 })
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: prov } = await supabaseAdmin
          .from('queue_providers')
          .select('verify_token')
          .eq('id', providerId)
          .maybeSingle()
        if (mode === 'subscribe' && prov?.verify_token && token === prov.verify_token) {
          return new Response(challenge ?? '', { status: 200 })
        }
        return new Response('forbidden', { status: 403 })
      },
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const providerId = url.searchParams.get('provider_id')
          if (!providerId) return Response.json({ error: 'provider_id required' }, { status: 400, headers: CORS })
          const body = await request.json().catch(() => ({}))
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          const { data: queue } = await supabaseAdmin
            .from('queues')
            .select('id, client_id')
            .eq('provider_id', providerId)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle()
          if (!queue) return Response.json({ ok: true, ignored: 'no queue' }, { headers: CORS })

          const messaging = body?.entry?.[0]?.messaging?.[0]
          if (!messaging?.message) return Response.json({ ok: true, ignored: 'no message' }, { headers: CORS })

          const senderId = String(messaging.sender?.id ?? '')
          const text = messaging.message?.text ?? ''
          if (!senderId) return Response.json({ ok: true }, { headers: CORS })

          await supabaseAdmin
            .from('chat_contacts')
            .upsert(
              {
                client_id: queue.client_id,
                phone: senderId,
                name: senderId,
                last_message_at: new Date().toISOString(),
                last_message_text: text?.slice(0, 200) ?? null,
              },
              { onConflict: 'client_id,phone' as any },
            )

          const { data: c } = await supabaseAdmin
            .from('chat_contacts')
            .select('id')
            .eq('client_id', queue.client_id)
            .eq('phone', senderId)
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
                channel: 'instagram',
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
            message_id: messaging.message?.mid ?? null,
            text,
            type: 'text',
            from_me: false,
            status: 'received',
            sender_name: senderId,
            metadata: body,
            timestamp: new Date(Number(messaging.timestamp) || Date.now()).toISOString(),
          } as any)
          return Response.json({ ok: true }, { headers: CORS })
        } catch (e: any) {
          console.error('[instagram-webhook]', e)
          return Response.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: CORS })
        }
      },
    },
  },
})
