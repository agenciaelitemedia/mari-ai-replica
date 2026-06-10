import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Queue } from '@/hooks/useQueues'
import { useQueueMutations } from '@/hooks/useQueues'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  queue: Queue | null
}

export function QueueFormDialog({ open, onOpenChange, queue }: Props) {
  const { updateQueue } = useQueueMutations()
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [evoInstance, setEvoInstance] = useState('')
  const [wabaToken, setWabaToken] = useState('')
  const [wabaNumberId, setWabaNumberId] = useState('')

  useEffect(() => {
    if (open && queue) {
      setName(queue.name ?? '')
      setIsActive(!!queue.is_active)
      setPhoneNumber(queue.phone_number ?? '')
      setEvoInstance(queue.evo_instance ?? '')
      setWabaToken(queue.waba_token ?? '')
      setWabaNumberId(queue.waba_number_id ?? '')
    }
  }, [open, queue])

  if (!queue) return null

  const handleSave = () => {
    const payload: any = { id: queue.id, name: name.trim(), is_active: isActive, phone_number: phoneNumber || null }
    if (queue.channel_type === 'uazapi') payload.evo_instance = evoInstance || null
    if (queue.channel_type === 'waba') {
      payload.waba_token = wabaToken || null
      payload.waba_number_id = wabaNumberId || null
    }
    updateQueue.mutate(payload, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar fila</DialogTitle>
          <DialogDescription>
            Canal: <span className="font-medium text-foreground">{queue.channel_type}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {queue.channel_type === 'uazapi' && (
            <div className="space-y-2">
              <Label>Instância UaZapi</Label>
              <Input value={evoInstance} onChange={(e) => setEvoInstance(e.target.value)} placeholder="QMarIA_..." />
            </div>
          )}

          {queue.channel_type === 'waba' && (
            <>
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input value={wabaToken} onChange={(e) => setWabaToken(e.target.value)} type="password" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input value={wabaNumberId} onChange={(e) => setWabaNumberId(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Telefone (opcional)</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Ex: 5511999999999" />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label>Fila ativa</Label>
              <p className="text-xs text-muted-foreground">Filas inativas não recebem mensagens.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={updateQueue.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || updateQueue.isPending}>
            {updateQueue.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
