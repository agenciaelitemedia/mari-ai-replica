import { ProviderCard } from './ProviderCard'

interface Props {
  providers: any[]
  onEdit: (provider: any) => void
  onDelete: (id: string) => void
  onTest?: (id: string) => void
  isTesting?: boolean
}

export function ProvidersList({ providers, onEdit, onDelete, onTest, isTesting }: Props) {
  if (!providers.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum provedor configurado. Clique em <strong>"Novo provedor"</strong> para começar.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {providers.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          onEdit={onEdit}
          onDelete={(prov) => onDelete(prov.id)}
          onTest={onTest}
          isTesting={isTesting}
        />
      ))}
    </div>
  )
}
