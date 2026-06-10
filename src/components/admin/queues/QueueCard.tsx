import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  MessageSquare, Phone, Globe, Instagram, MoreVertical, Pencil, Trash2, RotateCcw, Brain,
  QrCode, ExternalLink,
} from 'lucide-react'
import type { Queue } from '@/hooks/useQueues'
import { useQueueMutations } from '@/hooks/useQueues'
import { UazapiConnectDialog } from './UazapiConnectDialog'


const channelIcons: Record<string, React.ReactNode> = {
  uazapi: <Phone className="w-4 h-4" />,
  waba: <MessageSquare className="w-4 h-4" />,
  webchat: <Globe className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
}

const channelBadgeLabels: Record<string, string> = {
  uazapi: 'UaZapi',
  waba: 'API Oficial',
  webchat: 'WebChat',
  instagram: 'Instagram',
}

const channelBadgeClass: Record<string, string> = {
  uazapi: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  waba: 'border-blue-500/40 text-blue-700 dark:text-blue-300',
  webchat: 'border-purple-500/40 text-purple-700 dark:text-purple-300',
  instagram: 'border-pink-500/40 text-pink-700 dark:text-pink-300',
}

interface Props {
  queue: Queue
  onEdit: (q: Queue) => void
  onDelete: (q: Queue) => void
  onRestore: (q: Queue) => void
}

export function QueueCard({ queue, onEdit, onDelete, onRestore }: Props) {
  const [connectOpen, setConnectOpen] = useState(false)
  const { updateQueue } = useQueueMutations()

  const qs = (queue.settings ?? {}) as Record<string, unknown>
  const qAutoTranscribe = qs.auto_transcribe_audio === true
  const qAutoResolve = qs.auto_summary_on_resolve === true
  const qAutoClose = qs.auto_summary_on_close === true

  const toggleQueueFlag = (key: string, value: boolean) => {
    const nextSettings = { ...qs, [key]: value }
    updateQueue.mutate({ id: queue.id, settings: nextSettings } as never)
  }

  const identifierLabel =
    queue.channel_type === 'uazapi' ? queue.evo_instance
    : queue.channel_type === 'waba' ? queue.waba_number_id
    : null
  const identifierPrefix = queue.channel_type === 'uazapi' ? 'Instância' : 'ID'

  return (
    <Card className={`hover:shadow-md transition-shadow ${queue.is_deleted ? 'opacity-60 border-dashed' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{queue.name}</h3>
            <Badge variant={queue.is_active && !queue.is_deleted ? 'default' : 'secondary'}>
              {queue.is_deleted ? 'Excluída' : queue.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!queue.is_deleted && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(queue)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(queue)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
              {queue.is_deleted && (
                <DropdownMenuItem onClick={() => onRestore(queue)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className={channelBadgeClass[queue.channel_type] ?? ''}>
            <span className="flex items-center gap-1.5">
              {channelIcons[queue.channel_type]}
              {channelBadgeLabels[queue.channel_type] ?? queue.channel_type}
            </span>
          </Badge>
          {queue.provider?.name && (
            <span className="text-muted-foreground truncate">{queue.provider.name}</span>
          )}
        </div>

        {identifierLabel && (
          <div className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">{identifierPrefix}:</span> {identifierLabel}
          </div>
        )}
        {queue.phone_number && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Telefone:</span> {queue.phone_number}
          </div>
        )}

        {!queue.is_deleted && (
          <div className="pt-3 border-t space-y-3">
            {queue.channel_type === 'uazapi' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-between h-9 border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                onClick={() => setConnectOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Conectar WhatsApp</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Brain className="h-3 w-3" /> Automações
              </div>
              <div className="space-y-2">
                <ToggleRow id={`tr-${queue.id}`} label="Transcrever áudios" checked={qAutoTranscribe} onChange={(v) => toggleQueueFlag('auto_transcribe_audio', v)} />
                <ToggleRow id={`re-${queue.id}`} label="Resumo ao resolver" checked={qAutoResolve} onChange={(v) => toggleQueueFlag('auto_summary_on_resolve', v)} />
                <ToggleRow id={`cl-${queue.id}`} label="Resumo ao encerrar" checked={qAutoClose} onChange={(v) => toggleQueueFlag('auto_summary_on_close', v)} />
              </div>
            </div>
          </div>
        )}

        <UazapiConnectDialog 
          open={connectOpen} 
          onOpenChange={setConnectOpen} 
          queueId={queue.id} 
          queueName={queue.name}
        />
      </CardContent>
    </Card>
  )
}


function ToggleRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-xs text-foreground/80 cursor-pointer">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
