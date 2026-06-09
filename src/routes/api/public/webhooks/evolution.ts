// Webhook receiver for Evolution API
// URL: /api/public/webhooks/evolution?provider_id={id}
// Verified via apikey header matching the provider's evo_apikey
import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey, Authorization',
}

const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '')

export const Route = createFileRoute('/api/public/webhooks/evolution')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const providerId = url.searchParams.get('provider_id')
          if (!providerId) return Response.json({ error: 'provider_id required' }, { status: 400, headers: CORS })

          const apikey = request.headers.get('apikey') || url.searchParams.get('apikey') || ''
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          const { data: prov } = await supabaseAdmin
            .from('queue_providers')
            .select('id, client_id, evo_apikey, instance_name')
            .eq('id', providerId)
            .maybeSingle()
          if (!prov) return Response.json({ error: 'provider not found' }, { status: 404, headers: CORS })
          if (prov.evo_apikey && apikey && prov.evo_apikey !== apikey) {
            return Response.json({ error: 'invalid apikey' }, { status: 401, headers: CORS })
          }

          // Find a queue tied to this provider
          const { data: queue } = await supabaseAdmin
            .from('queues')
            .select('id, client_id')
            .eq('provider_id', providerId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()
          if (!queue) return Response.json({ ok: true, ignored: 'no queue' }, { headers: CORS })

          const body = await request.json().catch(() => ({}))
          const data = body.data ?? body
          const key = data?.key ?? {}
          const fromMe = !!key.fromMe
          const remoteJid: string = key.remoteJid || data.remoteJid || ''
          const phone = normalizePhone(remoteJid.split('@')[0])
          const text =
            data?.message?.conversation ||
            data?.message?.extendedTextMessage?.text ||
            data.body || data.text || ''
          const senderName = data.pushName || phone || 'WhatsApp'
          const isGroup = remoteJid.includes('@g.us')
          if (!phone) return Response.json({ ok: true, ignored: 'no phone' }, { headers: CORS })

          await supabaseAdmin
            .from('chat_contacts')
            .upsert(
              {
                client_id: queue.client_id,
                phone,
                name: senderName,
                is_group: isGroup,
                last_message_at: new Date().toISOString(),
                last_message_text: text?.slice(0, 200) ?? null,
              },
              { onConflict: 'client_id,phone' as any },
            )

          const { data: contact } = await supabaseAdmin
            .from('chat_contacts')
            .select('id')
            .eq('client_id', queue.client_id)
            .eq('phone', phone)
            .maybeSingle()
          if (!contact) return Response.json({ error: 'contact failed' }, { status: 500, headers: CORS })

          let { data: conv } = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('contact_id', contact.id)
            .in('status', ['pending', 'open', 'in_progress'])
            .limit(1)
            .maybeSingle()
          if (!conv) {
            const { data: c } = await supabaseAdmin
              .from('chat_conversations')
              .insert({
                contact_id: contact.id,
                client_id: queue.client_id,
                channel: 'whatsapp_evolution',
                status: fromMe ? 'open' : 'pending',
                protocol: '',
                queue_id: queue.id,
              } as any)
              .select('id')
              .single()
            conv = c
          }

          await supabaseAdmin.from('chat_messages').insert({
            contact_id: contact.id,
            client_id: queue.client_id,
            conversation_id: conv?.id ?? null,
            message_id: key.id ?? null,
            text,
            type: 'text',
            from_me: fromMe,
            status: fromMe ? 'sent' : 'received',
            sender_name: senderName,
            metadata: body,
            timestamp: new Date().toISOString(),
          } as any)

          return Response.json({ ok: true }, { headers: CORS })
        } catch (e: any) {
          console.error('[evolution-webhook]', e)
          return Response.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: CORS })
        }
      },
    },
  },
})
