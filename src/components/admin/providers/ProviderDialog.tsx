import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVIDER_TYPES, PROVIDER_LABELS, PROVIDER_DESCRIPTIONS, type ProviderType } from '@/lib/providers.types'
import { MessageCircle, Send, Instagram, Globe, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  provider: any | null
  clients: Array<{ id: string; name: string }>
  isSuperAdmin: boolean
  defaultClientId?: string | null
  onSave: (data: any) => void
  isSaving?: boolean
}

const ICONS: Record<ProviderType, any> = {
  uazapi: MessageCircle,
  evolution: Send,
  waba: Smartphone,
  instagram: Instagram,
  webchat: Globe,
}

export function ProviderDialog({ open, onClose, provider, clients, isSuperAdmin, defaultClientId, onSave, isSaving }: Props) {
  const [step, setStep] = useState(0)
  const [type, setType] = useState<ProviderType>('uazapi')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (open) {
      if (provider) {
        setType(provider.provider_type)
        setForm({ ...provider })
        setStep(1)
      } else {
        setType('uazapi')
        setForm({ is_active: true, client_id: defaultClientId ?? '' })
        setStep(0)
      }
    }
  }, [open, provider, defaultClientId])

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const canSave = useMemo(() => {
    if (!form.name || !form.client_id) return false
    if (type === 'uazapi' || type === 'evolution')
      return !!(form.evo_url && form.evo_apikey && form.instance_name)
    if (type === 'waba') return !!(form.waba_id && form.phone_number_id && form.access_token)
    if (type === 'instagram') return !!(form.ig_business_id && form.access_token)
    if (type === 'webchat') return true
    return false
  }, [form, type])

  const handleSave = () => {
    onSave({ ...form, provider_type: type })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{provider ? 'Editar provedor' : 'Novo provedor'}</DialogTitle>
          <DialogDescription>
            {step === 0 ? 'Selecione o tipo de canal' : `Configuração de ${PROVIDER_LABELS[type]}`}
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="grid grid-cols-2 gap-3 py-2">
            {PROVIDER_TYPES.map((t) => {
              const Icon = ICONS[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setStep(1)
                  }}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border border-border p-4 text-left transition-all hover:border-primary hover:shadow-md',
                    type === t && 'border-primary bg-primary/5',
                  )}
                >
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{PROVIDER_LABELS[t]}</p>
                    <p className="text-xs text-muted-foreground">{PROVIDER_DESCRIPTIONS[t]}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="col-span-2">
              <Label>Nome interno</Label>
              <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Ex: WhatsApp Vendas" />
            </div>

            <div className={isSuperAdmin ? '' : 'hidden'}>
              <Label>Cliente</Label>
              <Select value={form.client_id ?? ''} onValueChange={(v) => set('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              <Label>Ativo</Label>
            </div>

            {(type === 'uazapi' || type === 'evolution') && (
              <>
                <div className="col-span-2">
                  <Label>URL do servidor</Label>
                  <Input value={form.evo_url ?? ''} onChange={(e) => set('evo_url', e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>{type === 'uazapi' ? 'Token' : 'API Key'}</Label>
                  <Input value={form.evo_apikey ?? ''} onChange={(e) => set('evo_apikey', e.target.value)} />
                </div>
                <div>
                  <Label>Instance Name</Label>
                  <Input value={form.instance_name ?? ''} onChange={(e) => set('instance_name', e.target.value)} />
                </div>
                <div>
                  <Label>Número (opcional)</Label>
                  <Input value={form.phone_number ?? ''} onChange={(e) => set('phone_number', e.target.value)} placeholder="5511999999999" />
                </div>
              </>
            )}

            {type === 'waba' && (
              <>
                <div>
                  <Label>WABA ID</Label>
                  <Input value={form.waba_id ?? ''} onChange={(e) => set('waba_id', e.target.value)} />
                </div>
                <div>
                  <Label>Phone Number ID</Label>
                  <Input value={form.phone_number_id ?? ''} onChange={(e) => set('phone_number_id', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Access Token (permanente)</Label>
                  <Input value={form.access_token ?? ''} onChange={(e) => set('access_token', e.target.value)} />
                </div>
                <div>
                  <Label>App Secret</Label>
                  <Input value={form.app_secret ?? ''} onChange={(e) => set('app_secret', e.target.value)} />
                </div>
                <div>
                  <Label>Verify Token (auto se vazio)</Label>
                  <Input value={form.verify_token ?? ''} onChange={(e) => set('verify_token', e.target.value)} />
                </div>
              </>
            )}

            {type === 'instagram' && (
              <>
                <div>
                  <Label>IG Business ID</Label>
                  <Input value={form.ig_business_id ?? ''} onChange={(e) => set('ig_business_id', e.target.value)} />
                </div>
                <div>
                  <Label>Page ID (opcional)</Label>
                  <Input value={form.page_id ?? ''} onChange={(e) => set('page_id', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Access Token</Label>
                  <Input value={form.access_token ?? ''} onChange={(e) => set('access_token', e.target.value)} />
                </div>
                <div>
                  <Label>Verify Token (auto se vazio)</Label>
                  <Input value={form.verify_token ?? ''} onChange={(e) => set('verify_token', e.target.value)} />
                </div>
              </>
            )}

            {type === 'webchat' && (
              <>
                {form.widget_key && (
                  <div className="col-span-2">
                    <Label>Widget Key</Label>
                    <Input value={form.widget_key} readOnly className="font-mono text-xs" />
                  </div>
                )}
                <div className="col-span-2">
                  <Label>Origens permitidas (uma por linha)</Label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm min-h-[80px]"
                    value={(form.allowed_origins ?? []).join('\n')}
                    onChange={(e) => set('allowed_origins', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                    placeholder="https://meusite.com"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && !provider && (
            <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 1 && (
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar provedor'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
