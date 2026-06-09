import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2, MessageSquare, Instagram, Globe, MessageCircle } from 'lucide-react'
import { type ProviderType } from '@/lib/providers.types'

interface Props {
  queue: any
  onEdit: (q: any) => void
  onDelete: (id: string) => void
}

const CHANNEL_ICONS: Record<string, any> = {
  uazapi: MessageCircle,
  waba: MessageSquare,
  instagram: Instagram,
  webchat: Globe,
}

const CHANNEL_COLORS: Record<string, string> = {
  uazapi: 'text-green-600 bg-green-50',
  waba: 'text-blue-600 bg-blue-50',
  instagram: 'text-pink-600 bg-pink-50',
  webchat: 'text-purple-600 bg-purple-50',
}

export function QueueCard({ queue, onEdit, onDelete }: Props) {
  const Icon = CHANNEL_ICONS[queue.channel_type as string] || MessageSquare
  const colorClass = CHANNEL_COLORS[queue.channel_type as string] || 'text-gray-600 bg-gray-50'

  return (
    <Card className="p-4 hover:shadow-md transition-all border-l-4 border-l-primary/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-tight">{queue.name}</h3>
              {queue.is_active ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none">Ativa</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground opacity-60">Inativa</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground/70">Provedor:</span> {queue.provider?.name || 'Não vinculado'}
              </span>
              {queue.phone_number && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground/70">ID:</span> {queue.phone_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(queue)} className="hover:bg-primary/10 hover:text-primary transition-colors">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(queue.id)} className="hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
