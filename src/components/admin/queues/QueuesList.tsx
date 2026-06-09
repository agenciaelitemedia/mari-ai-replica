import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PROVIDER_LABELS, type ProviderType } from '@/lib/providers.types'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  queues: any[]
  clientsById: Record<string, string>
  onEdit: (q: any) => void
  onDelete: (id: string) => void
}

export function QueuesList({ queues, clientsById, onEdit, onDelete }: Props) {
  if (queues.length === 0)
    return <p className="text-sm text-muted-foreground p-8 text-center">Nenhuma fila cadastrada.</p>
  return (
    <div className="grid gap-3">
      {queues.map((q) => (
        <Card key={q.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{q.name}</p>
              {q.provider?.provider_type && (
                <Badge variant="secondary">
                  {PROVIDER_LABELS[q.provider.provider_type as ProviderType] ?? q.provider.provider_type}
                </Badge>
              )}
              {q.is_active ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20">Ativa</Badge>
              ) : (
                <Badge variant="outline">Inativa</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliente: {clientsById[q.client_id] ?? q.client_id}
              {q.provider?.name ? ` • Provedor: ${q.provider.name}` : ''}
              {q.phone_number ? ` • ${q.phone_number}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(q)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(q.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
