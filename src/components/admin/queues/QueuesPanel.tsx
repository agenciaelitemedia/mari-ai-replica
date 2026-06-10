import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useQueues, useQueuesUsage, type Queue } from '@/hooks/useQueues'
import { QueueCard } from './QueueCard'
import { QueueWizardDialog } from './QueueWizardDialog'
import { QueueFormDialog } from './QueueFormDialog'
import { DeleteQueueDialog } from './DeleteQueueDialog'
import { RestoreQueueDialog } from './RestoreQueueDialog'

export function QueuesPanel() {
  const navigate = useNavigate()
  const [showDeleted, setShowDeleted] = useState(false)
  const { data: queues = [], isLoading } = useQueues(showDeleted)
  const { data: usage } = useQueuesUsage()
  const queueLimit = usage?.limit ?? 1

  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<Queue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Queue | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Queue | null>(null)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)

  const activeQueues = queues.filter((q) => !q.is_deleted)
  const limitReached = activeQueues.length >= queueLimit

  const handleNewClick = () => {
    if (limitReached) setLimitDialogOpen(true)
    else setWizardOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Filas de Atendimento</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os canais de comunicação · {activeQueues.length} / {queueLimit} filas usadas
          </p>
        </div>
        <Button onClick={handleNewClick}>
          <Plus className="w-4 h-4 mr-2" /> Nova Fila
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
        <Label htmlFor="show-deleted" className="text-sm text-muted-foreground">Mostrar excluídas</Label>
      </div>

      {queues.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p className="mb-2">Nenhuma fila configurada</p>
          <p className="text-sm">Crie uma fila para começar a receber mensagens</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queues.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              onEdit={setEditing}
              onDelete={setDeleteTarget}
              onRestore={setRestoreTarget}
            />
          ))}
        </div>
      )}

      <QueueWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />

      {editing && (
        <QueueFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          queue={editing}
        />
      )}

      {deleteTarget && (
        <DeleteQueueDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          queue={deleteTarget}
          otherQueues={activeQueues.filter((q) => q.id !== deleteTarget.id)}
        />
      )}

      {restoreTarget && (
        <RestoreQueueDialog
          open={!!restoreTarget}
          onOpenChange={(o) => !o && setRestoreTarget(null)}
          queue={restoreTarget}
          activeQueues={activeQueues}
        />
      )}

      <AlertDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de filas atingido</AlertDialogTitle>
            <AlertDialogDescription>
              Seu plano permite {queueLimit === 1 ? '1 fila' : `${queueLimit} filas`} e você já está utilizando
              {' '}{activeQueues.length === 1 ? '1 fila' : `${activeQueues.length} filas`}. Para criar uma nova fila,
              contrate filas adicionais ou faça upgrade do plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setLimitDialogOpen(false); navigate({ to: '/plans' }) }}>
              Ver planos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
