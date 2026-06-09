import { QueueCard } from './QueueCard'

interface Props {
  queues: any[]
  onEdit: (q: any) => void
  onDelete: (id: string) => void
}

export function QueuesList({ queues, onEdit, onDelete }: Props) {
  if (queues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted/50">
        <div className="p-4 bg-muted/50 rounded-full mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-lg font-medium text-muted-foreground">Nenhuma fila cadastrada</p>
        <p className="text-sm text-muted-foreground mt-1">Comece criando sua primeira fila de atendimento.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {queues.map((q) => (
        <QueueCard key={q.id} queue={q} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
