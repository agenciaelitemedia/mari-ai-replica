import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  open: boolean
  onClose: () => void
  queue: any | null
  providers: any[]
  onSave: (data: any) => void
  isSaving?: boolean
}

export function QueueDialog({ open, onClose, queue, providers, onSave, isSaving }: Props) {
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (open) {
      if (queue) setForm({ ...queue })
      else setForm({ is_active: true, settings: { welcome_message: '' } })
    }
  }, [open, queue])

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))
  const setSetting = (k: string, v: any) => setForm((p: any) => ({ ...p, settings: { ...(p.settings ?? {}), [k]: v } }))

  const availableProviders = providers.filter((p) => p.is_active)
  const canSave = !!(form.name && form.provider_id)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{queue ? 'Editar fila' : 'Nova fila'}</DialogTitle>
          <DialogDescription>Vincule a fila a um provedor já cadastrado.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Nome da fila</Label>
            <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Atendimento Principal" />
          </div>

          <div className="col-span-2">
            <Label>Provedor</Label>
            <Select value={form.provider_id ?? ''} onValueChange={(v) => set('provider_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o provedor" /></SelectTrigger>
              <SelectContent>
                {availableProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.provider_type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Número/Identificador (opcional)</Label>
            <Input value={form.phone_number ?? ''} onChange={(e) => set('phone_number', e.target.value)} />
          </div>

          <div className="col-span-2">
            <Label>Mensagem de saudação</Label>
            <textarea
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm min-h-[80px]"
              value={form.settings?.welcome_message ?? ''}
              onChange={(e) => setSetting('welcome_message', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 col-span-2">
            <Switch checked={!!form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            <Label>Fila ativa</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({
            id: form.id,
            name: form.name,
            provider_id: form.provider_id,
            phone_number: form.phone_number || undefined,
            settings: form.settings ?? {},
            is_active: !!form.is_active,
          })} disabled={!canSave || isSaving}>
            {isSaving ? 'Salvando…' : 'Salvar fila'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
