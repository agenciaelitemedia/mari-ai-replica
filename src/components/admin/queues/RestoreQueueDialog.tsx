import { useEffect, useState } from 'react'
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RotateCcw } from 'lucide-react'
import type { Queue } from '@/hooks/useQueues'
import { useQueueMutations } from '@/hooks/useQueues'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  queue: Queue
  activeQueues: Queue[]
}

export function RestoreQueueDialog({ open, onOpenChange, queue, activeQueues }: Props) {
  const { restoreQueue } = useQueueMutations()
  const [mode, setMode] = useState<'simple' | 'migrate'>('simple')
  const [sourceQueueId, setSourceQueueId] = useState('')

  useEffect(() => {
    if (!open) { setMode('simple'); setSourceQueueId('') }
  }, [open])

  const canRestore = mode === 'simple' || !!sourceQueueId

  const handleRestore = () => {
    if (!canRestore) return
    restoreQueue.mutate(
      {
        queue_id: queue.id,
        migrate_to_queue_id: mode === 'migrate' ? sourceQueueId : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" /> Restaurar: {queue.name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            A fila voltará a ficar ativa e poderá receber novas conversas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'simple' | 'migrate')} className="space-y-3">
          <div className="flex items-start gap-2 p-3 border border-border rounded-lg">
            <RadioGroupItem value="simple" id="r-simple" className="mt-1" />
            <Label htmlFor="r-simple" className="cursor-pointer text-sm">
              <span className="font-medium">Apenas restaurar</span>
              <p className="text-xs text-muted-foreground mt-0.5">Reativa a fila sem mover conversas.</p>
            </Label>
          </div>
          <div className="flex items-start gap-2 p-3 border border-border rounded-lg">
            <RadioGroupItem value="migrate" id="r-migrate" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="r-migrate" className="cursor-pointer text-sm">
                <span className="font-medium">Restaurar e migrar conversas</span>
                <p className="text-xs text-muted-foreground mt-0.5">Move conversas ativas de outra fila para esta.</p>
              </Label>
              {mode === 'migrate' && (
                <Select value={sourceQueueId} onValueChange={setSourceQueueId}>
                  <SelectTrigger><SelectValue placeholder="Fila de origem das conversas" /></SelectTrigger>
                  <SelectContent>
                    {activeQueues.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">Nenhuma fila ativa disponível</div>
                    ) : activeQueues.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleRestore} disabled={!canRestore || restoreQueue.isPending}>
            {restoreQueue.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Restaurar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
