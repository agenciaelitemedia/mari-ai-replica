import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVIDER_LABELS, type ProviderType } from '@/lib/providers.types'
import { MessageSquare, Settings2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
      if (queue) {
        setForm({ ...queue })
      } else {
        setForm({ 
          is_active: true, 
          settings: { 
            welcome_message: 'Olá! Como posso ajudar você hoje?',
            out_of_hours_message: 'Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve.',
          } 
        })
      }
    }
  }, [open, queue])

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))
  const setSetting = (k: string, v: any) => setForm((p: any) => ({ ...p, settings: { ...(p.settings ?? {}), [k]: v } }))

  const availableProviders = providers.filter((p) => p.is_active)
  const canSave = !!(form.name && form.provider_id)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings2 className="h-6 w-6 text-primary" />
            {queue ? 'Configurações da Fila' : 'Nova Fila de Atendimento'}
          </DialogTitle>
          <DialogDescription>
            Defina como essa fila irá operar e qual canal ela utilizará.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Nome da fila</Label>
              <Input 
                value={form.name ?? ''} 
                onChange={(e) => set('name', e.target.value)} 
                placeholder="Ex: Suporte Técnico, Vendas..." 
                className="h-11"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Provedor (Canal)</Label>
              <Select value={form.provider_id ?? ''} onValueChange={(v) => set('provider_id', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione um provedor ativo" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum provedor ativo encontrado.</div>
                  ) : (
                    availableProviders.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{PROVIDER_LABELS[p.provider_type as ProviderType]}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Número ou Identificador (Opcional)</Label>
              <Input 
                value={form.phone_number ?? ''} 
                onChange={(e) => set('phone_number', e.target.value)} 
                placeholder="Ex: 5511999999999"
                className="h-11"
              />
              <p className="text-[10px] text-muted-foreground">Opcional: Informe se deseja fixar um número específico para esta fila.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/70">Mensagens Automáticas</h4>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Mensagem de Saudação</Label>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  value={form.settings?.welcome_message ?? ''}
                  onChange={(e) => setSetting('welcome_message', e.target.value)}
                  placeholder="Enviada quando o cliente inicia um contato..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Mensagem Fora de Horário</Label>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  value={form.settings?.out_of_hours_message ?? ''}
                  onChange={(e) => setSetting('out_of_hours_message', e.target.value)}
                  placeholder="Enviada quando o atendimento está encerrado..."
                />
              </div>
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs text-primary/80">
              A fila será vinculada automaticamente ao seu identificador de cliente (tenant).
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Status da Fila</Label>
              <p className="text-xs text-muted-foreground">Filas inativas não recebem novas mensagens.</p>
            </div>
            <Switch checked={!!form.is_active} onCheckedChange={(v) => set('is_active', v)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button 
            className="px-8 shadow-lg shadow-primary/20"
            onClick={() => onSave({
              id: form.id,
              name: form.name,
              provider_id: form.provider_id,
              phone_number: form.phone_number || undefined,
              settings: form.settings ?? {},
              is_active: !!form.is_active,
            })} 
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Salvando...' : queue ? 'Atualizar Fila' : 'Criar Fila'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
