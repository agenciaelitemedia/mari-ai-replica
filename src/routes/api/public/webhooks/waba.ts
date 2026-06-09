// WABA (WhatsApp Business API - Meta Cloud) webhook
// GET: challenge verification with provider's verify_token
// POST: incoming messages
// URL: /api/public/webhooks/waba?provider_id={id}
import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256',
}

export const Route = createFileRoute('/api/public/webhooks/waba')({
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

          const { data: prov } = await supabaseAdmin
            .from('queue_providers')
            .select('id, client_id')
            .eq('id', providerId)
            .maybeSingle()
          if (!prov) return Response.json({ error: 'not found' }, { status: 404, headers: CORS })

          const { data: queue } = await supabaseAdmin
            .from('queues')
            .select('id, client_id')
            .eq('provider_id', providerId)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle()
          if (!queue) return Response.json({ ok: true, ignored: 'no queue' }, { headers: CORS })

          // Meta payload: { entry: [{ changes: [{ value: { messages, contacts } }] }] }
          const change = body?.entry?.[0]?.changes?.[0]?.value
          const msg = change?.messages?.[0]
          const contact = change?.contacts?.[0]
          if (!msg) return Response.json({ ok: true, ignored: 'no message' }, { headers: CORS })

          const phone = String(msg.from || '').replace(/\D/g, '')
          const text = msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || ''
          const senderName = contact?.profile?.name || phone

          await supabaseAdmin
            .from('chat_contacts')
            .upsert(
              {
                client_id: queue.client_id,
                phone,
                name: senderName,
                last_message_at: new Date().toISOString(),
                last_message_text: text?.slice(0, 200) ?? null,
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
                channel: 'whatsapp_waba',
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
            message_id: msg.id ?? null,
            text,
            type: msg.type || 'text',
            from_me: false,
            status: 'received',
            sender_name: senderName,
            metadata: body,
            timestamp: new Date((Number(msg.timestamp) || Date.now() / 1000) * 1000).toISOString(),
          } as any)

          return Response.json({ ok: true }, { headers: CORS })
        } catch (e: any) {
          console.error('[waba-webhook]', e)
          return Response.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: CORS })
        }
      },
    },
  },
})
