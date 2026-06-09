import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { listConversations, listMessages, sendMessage } from '@/lib/chat.functions'
import { listBoards, getBoardData, linkConversationToDeal } from '@/lib/crm.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, MessageSquare, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatPage,
})

function ChatPage() {
  const qc = useQueryClient()
  const fetchConvs = useServerFn(listConversations)
  const fetchMsgs = useServerFn(listMessages)
  const sendFn = useServerFn(sendMessage)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const convsQ = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => fetchConvs({ data: {} }),
    refetchInterval: 15000,
  })

  const msgsQ = useQuery({
    queryKey: ['chat-messages', selectedId],
    queryFn: () => fetchMsgs({ data: { conversationId: selectedId! } }),
    enabled: !!selectedId,
  })

  const sendM = useMutation({
    mutationFn: (text: string) => sendFn({ data: { conversationId: selectedId!, text } }),
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['chat-messages', selectedId] })
      qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
  })

  // Realtime: refresh on new messages or conversation updates
  useEffect(() => {
    const ch = supabase
      .channel('chat-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        qc.invalidateQueries({ queryKey: ['chat-messages', selectedId] })
        qc.invalidateQueries({ queryKey: ['chat-conversations'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        qc.invalidateQueries({ queryKey: ['chat-conversations'] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [qc, selectedId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgsQ.data?.messages?.length])

  const conversations = convsQ.data?.conversations ?? []
  const selected = useMemo(
    () => conversations.find((c: any) => c.id === selectedId),
    [conversations, selectedId],
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Conversations list */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="size-4" /> Conversas
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {conversations.length} ativas
          </p>
        </div>
        <ScrollArea className="flex-1">
          {convsQ.isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando…</p>}
          {conversations.length === 0 && !convsQ.isLoading && (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhuma conversa ainda. Configure uma instância UazAPI em Configurações.
            </p>
          )}
          {conversations.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-3 border-b hover:bg-muted/50 transition ${
                selectedId === c.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{c.contact?.name ?? 'Sem nome'}</span>
                <Badge variant={c.status === 'pending' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {c.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {c.contact?.last_message_text ?? c.protocol}
              </p>
            </button>
          ))}
        </ScrollArea>
      </Card>

      {/* Messages panel */}
      <Card className="flex-1 flex flex-col">
        {!selected && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa
          </div>
        )}
        {selected && (
          <>
            <div className="p-4 border-b">
              <p className="font-semibold">{selected.contact?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.contact?.phone} • {selected.protocol}
              </p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgsQ.data?.messages?.map((m: any) => (
                <div
                  key={m.id}
                  className={`flex ${m.from_me ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      m.internal_note
                        ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100'
                        : m.from_me
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                    }`}
                  >
                    {m.text}
                    <div className="text-[10px] opacity-70 mt-1">
                      {new Date(m.timestamp).toLocaleTimeString()}
                      {m.from_me && ` • ${m.status}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form
              className="p-4 border-t flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (draft.trim()) sendM.mutate(draft.trim())
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Digite uma mensagem…"
                disabled={sendM.isPending}
              />
              <Button type="submit" disabled={!draft.trim() || sendM.isPending}>
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
