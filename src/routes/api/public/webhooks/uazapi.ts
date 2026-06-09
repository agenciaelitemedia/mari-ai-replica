// Public webhook receiver for UazAPI WhatsApp events.
// URL: /api/public/webhooks/uazapi?queue_id={queue_id}
// Verified via per-queue token (evo_apikey) sent as ?token=... or header `x-api-key`.

import { createFileRoute } from '@tanstack/react-router'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
}

function normalizePhone(p: string) {
  return String(p || '').replace(/\D/g, '')
}

export const Route = createFileRoute('/api/public/webhooks/uazapi')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const queueId = url.searchParams.get('queue_id')
          if (!queueId) {
            return Response.json({ error: 'queue_id required' }, { status: 400, headers: CORS })
          }
          const token =
            url.searchParams.get('token') ||
            request.headers.get('x-api-key') ||
            request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

          const body = await request.json().catch(() => ({}))
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          // Load + verify queue
          const { data: queue, error: qErr } = await supabaseAdmin
            .from('queues')
            .select('id, client_id, evo_apikey, evo_instance')
            .eq('id', queueId)
            .eq('is_deleted', false)
            .maybeSingle()

          if (qErr || !queue) {
            return Response.json({ error: 'queue not found' }, { status: 404, headers: CORS })
          }
          if (queue.evo_apikey && token && queue.evo_apikey !== token) {
            return Response.json({ error: 'invalid token' }, { status: 401, headers: CORS })
          }

          // Generic UazAPI shape: { event, instance, data: { ... } } or message in body.message
          const event = body.event || body.type || 'message'
          const data = body.data ?? body.message ?? body
          const fromMe = !!(data.fromMe ?? data.from_me ?? data?.key?.fromMe)
          const remoteJid: string =
            data.chatid ||
            data.chatId ||
            data.remoteJid ||
            data?.key?.remoteJid ||
            data.from ||
            ''
          const phoneRaw = remoteJid.split('@')[0]
          const phone = normalizePhone(phoneRaw)
          const isGroup = remoteJid.includes('@g.us')
          const text =
            data.text ||
            data.body ||
            data.caption ||
            data?.message?.conversation ||
            data?.message?.extendedTextMessage?.text ||
            ''
          const messageId = data.id || data.messageId || data?.key?.id || null
          const senderName = data.senderName || data.notifyName || data.pushName || phone || 'WhatsApp'

          if (!phone) {
            // Acknowledge and ignore (status updates etc.)
            return Response.json({ ok: true, ignored: 'no phone' }, { headers: CORS })
          }

          // Upsert contact
          const { data: contact } = await supabaseAdmin
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
              { onConflict: 'client_id,phone' as any, ignoreDuplicates: false },
            )
            .select('id')
            .maybeSingle()

          let contactId = contact?.id as string | undefined
          if (!contactId) {
            const { data: existing } = await supabaseAdmin
              .from('chat_contacts')
              .select('id')
              .eq('client_id', queue.client_id)
              .eq('phone', phone)
              .maybeSingle()
            contactId = existing?.id
          }
          if (!contactId) {
            return Response.json({ error: 'contact upsert failed' }, { status: 500, headers: CORS })
          }

          // Find or open conversation
          let { data: conv } = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('contact_id', contactId)
            .in('status', ['pending', 'open', 'in_progress'])
            .order('opened_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!conv) {
            const { data: created } = await supabaseAdmin
              .from('chat_conversations')
              .insert({
                contact_id: contactId,
                client_id: queue.client_id,
                channel: 'whatsapp_uazapi',
                status: fromMe ? 'open' : 'pending',
                protocol: '',
                queue_id: queue.id,
              } as any)
              .select('id')
              .single()
            conv = created
          }

          // Insert message
          if (event === 'message' || event === 'messages.upsert' || data.body || data.text) {
            await supabaseAdmin.from('chat_messages').insert({
              contact_id: contactId,
              client_id: queue.client_id,
              conversation_id: conv?.id ?? null,
              message_id: messageId,
              text,
              type: data.type || 'text',
              from_me: fromMe,
              status: data.status || (fromMe ? 'sent' : 'received'),
              media_url: data.mediaUrl || data.media_url || null,
              file_name: data.fileName || null,
              caption: data.caption || null,
              sender_name: senderName,
              metadata: body,
              timestamp: new Date((data.timestamp ? Number(data.timestamp) * 1000 : Date.now())).toISOString(),
            } as any)

            if (!fromMe) {
              await supabaseAdmin
                .from('chat_contacts')
                .update({ unread_count: 1 as any })
                .eq('id', contactId)
            }
          }

          return Response.json({ ok: true }, { headers: CORS })
        } catch (err: any) {
          console.error('[uazapi-webhook] error', err)
          return Response.json({ error: err?.message ?? 'unknown' }, { status: 500, headers: CORS })
        }
      },
    },
  },
})
