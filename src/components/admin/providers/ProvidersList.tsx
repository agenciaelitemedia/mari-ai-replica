import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PROVIDER_LABELS, type ProviderType } from '@/lib/providers.types'
import { Pencil, Trash2, Wifi, Power } from 'lucide-react'

interface Props {
  providers: any[]
  clientsById: Record<string, string>
  onEdit: (p: any) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
  isTesting?: boolean
}

export function ProvidersList({ providers, clientsById, onEdit, onDelete, onTest, isTesting }: Props) {
  if (providers.length === 0) {
    return <p className="text-sm text-muted-foreground p-8 text-center">Nenhum provedor cadastrado ainda.</p>
  }
  return (
    <div className="grid gap-3">
      {providers.map((p) => (
        <Card key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{p.name}</p>
              <Badge variant="secondary">{PROVIDER_LABELS[p.provider_type as ProviderType] ?? p.provider_type}</Badge>
              {p.is_active ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20">Ativo</Badge>
              ) : (
                <Badge variant="outline">Inativo</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliente: {clientsById[p.client_id] ?? p.client_id}
              {p.phone_number ? ` • ${p.phone_number}` : ''}
              {p.instance_name ? ` • ${p.instance_name}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onTest(p.id)} disabled={isTesting}>
              <Wifi className="h-4 w-4 mr-1" /> Testar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(p.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
