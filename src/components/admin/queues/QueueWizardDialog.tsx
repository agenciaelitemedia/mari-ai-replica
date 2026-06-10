import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone, MessageSquare, Globe, Instagram, ArrowLeft, ArrowRight, Check, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { useQueueMutations, useQueues, useQueuesUsage } from '@/hooks/useQueues'
import { WabaEmbeddedSignupButton } from '@/components/admin/providers/WabaEmbeddedSignupButton'

const channelTypes = [
  { value: 'uazapi', label: 'UaZapi', description: 'WhatsApp não-oficial via UaZapi', icon: Phone, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'waba', label: 'API Oficial (WABA)', description: 'WhatsApp Business API oficial da Meta', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  { value: 'webchat', label: 'WebChat', description: 'Chat integrado ao seu site', icon: Globe, color: 'text-purple-600 bg-purple-50' },
  { value: 'instagram', label: 'Instagram', description: 'Mensagens do Instagram via Meta', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueWizardDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [queueName, setQueueName] = useState('')

  // WABA per-queue
  const [wabaToken, setWabaToken] = useState('')
  const [wabaBusinessId, setWabaBusinessId] = useState('')
  const [wabaNumberId, setWabaNumberId] = useState('')

  const { providers: allProviders = [] } = useProvidersAdmin()
  const { createQueue } = useQueueMutations()
  const { data: usage } = useQueuesUsage()
  const { data: existingQueues = [] } = useQueues(false)

  const queueLimit = usage?.limit ?? 1
  const activeCount = existingQueues.filter((q) => !q.is_deleted).length
  const limitReached = activeCount >= queueLimit

  const evoInstance = useMemo(() => {
    if (selectedType !== 'uazapi') return ''
    const rand = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID().split('-')[0]
      : Math.random().toString(36).slice(2, 10)
    return `MarI.A.-${rand}`
  }, [selectedType, user?.id, open])

  const filteredProviders = allProviders.filter(
    (p: any) => p.provider_type === selectedType && p.is_active,
  )

  useEffect(() => {
    if (!open) {
      setStep(1)
      setSelectedType('')
      setSelectedProviderId('')
      setQueueName('')
      setWabaToken('')
      setWabaBusinessId('')
      setWabaNumberId('')
    }
  }, [open])

  useEffect(() => {
    if (selectedType === 'waba' || selectedType === 'webchat') {
      setSelectedProviderId('')
    } else if (filteredProviders.length === 1) {
      setSelectedProviderId(filteredProviders[0].id)
    } else {
      setSelectedProviderId('')
    }
  }, [selectedType, filteredProviders.length])

  const canNextFromStep1 = !!selectedType && !limitReached
  const canNextFromStep2 =
    selectedType === 'webchat' ? true :
    selectedType === 'waba' ? !!(wabaToken && wabaBusinessId && wabaNumberId) :
    !!selectedProviderId
  const canCreate = canNextFromStep2 && queueName.trim().length > 0

  const handleWabaSignupSuccess = (data: { accessToken: string; wabaBusinessId: string }) => {
    setWabaToken(data.accessToken)
    setWabaBusinessId(data.wabaBusinessId)
  }

  const handleCreate = () => {
    const payload: any = {
      name: queueName.trim(),
      channel_type: selectedType,
      provider_id: selectedType === 'waba' || selectedType === 'webchat' ? null : selectedProviderId,
      is_active: true,
      settings: {},
    }
    if (selectedType === 'uazapi') payload.evo_instance = evoInstance
    if (selectedType === 'waba') {
      payload.waba_token = wabaToken
      payload.waba_id = wabaBusinessId
      payload.waba_number_id = wabaNumberId
    }
    createQueue.mutate(payload, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Fila de Atendimento</DialogTitle>
          <DialogDescription>
            Passo {step} de 3 — {step === 1 ? 'escolha o canal' : step === 2 ? 'configure o provedor' : 'identifique a fila'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Channel selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {channelTypes.map((ch) => {
              const Icon = ch.icon
              const isWaba = ch.value === 'waba'
              const isWebchat = ch.value === 'webchat'
              const hasProvider = allProviders.some((p: any) => p.provider_type === ch.value && p.is_active)
              return (
                <Card
                  key={ch.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedType === ch.value ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedType(ch.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ch.label}</p>
                        {isWebchat ? (
                          <Badge variant="outline" className="text-xs mt-0.5">Sem provedor necessário</Badge>
                        ) : (
                          <Badge variant={isWaba || hasProvider ? 'default' : 'outline'} className="text-xs mt-0.5">
                            {isWaba ? 'Conecte ao criar' : hasProvider ? 'Provedor configurado' : 'Sem provedor'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{ch.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Step 2: Provider config */}
        {step === 2 && (
          <div className="space-y-4">
            {selectedType === 'webchat' ? (
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  O WebChat não requer configuração de provedor externo. Prossiga para a próxima etapa.
                </p>
              </div>
            ) : selectedType === 'waba' ? (
              <div className="space-y-4">
                {!wabaToken || !wabaBusinessId ? (
                  <div className="space-y-3">
                    <div className="p-4 border border-border rounded-lg bg-muted/40 space-y-2">
                      <p className="text-sm font-medium text-foreground">Conectar conta Meta</p>
                      <p className="text-xs text-muted-foreground">
                        Faça login com a conta Meta para autorizar a API Oficial do WhatsApp.
                        Os tokens ficarão vinculados apenas a esta fila.
                      </p>
                    </div>
                    <WabaEmbeddedSignupButton onSuccess={handleWabaSignupSuccess} />
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Ou cole manualmente:</p>
                      <Input placeholder="Access Token" value={wabaToken} onChange={(e) => setWabaToken(e.target.value)} />
                      <Input placeholder="WABA Business ID" value={wabaBusinessId} onChange={(e) => setWabaBusinessId(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 border border-emerald-200 rounded-lg bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div className="text-xs flex-1">
                      <p className="font-medium text-foreground">Conta Meta conectada</p>
                      <p className="text-muted-foreground">Business ID: {wabaBusinessId}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setWabaToken(''); setWabaBusinessId(''); setWabaNumberId('') }}>
                      Reconectar
                    </Button>
                  </div>
                )}
                {wabaToken && wabaBusinessId && (
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input
                      value={wabaNumberId}
                      onChange={(e) => setWabaNumberId(e.target.value)}
                      placeholder="Ex: 1234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Copie do Meta Business Manager → WhatsApp → Phone numbers.
                    </p>
                  </div>
                )}
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="flex items-center gap-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Nenhum provedor configurado</p>
                  <p className="text-xs text-muted-foreground">
                    Vá em Configurações → Provedores para adicionar um provedor do tipo {channelTypes.find((c) => c.value === selectedType)?.label}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Um provedor é configurado uma vez e pode ser usado por qualquer cliente.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o provedor" /></SelectTrigger>
                    <SelectContent>
                      {filteredProviders.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedType === 'uazapi' && selectedProviderId && (
                  <div className="p-3 border border-border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      A instância será criada como <strong className="text-foreground">{evoInstance}</strong>.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Name */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da fila</Label>
              <Input
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                placeholder="Ex: Suporte, Vendas, Financeiro..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Esse nome aparece para seus agentes ao distribuir os atendimentos.
              </p>
            </div>
            {selectedType === 'uazapi' && (
              <div className="p-3 border border-border rounded-lg bg-muted/30 text-xs space-y-1">
                <p><strong className="text-foreground">Canal:</strong> UaZapi</p>
                <p><strong className="text-foreground">Instância:</strong> {evoInstance}</p>
              </div>
            )}
            {selectedType === 'waba' && (
              <div className="p-3 border border-border rounded-lg bg-muted/30 text-xs space-y-1">
                <p><strong className="text-foreground">Canal:</strong> WABA</p>
                <p><strong className="text-foreground">Business ID:</strong> {wabaBusinessId}</p>
                <p><strong className="text-foreground">Phone Number ID:</strong> {wabaNumberId}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={createQueue.isPending}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canNextFromStep1 : !canNextFromStep2}
            >
              Avançar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={!canCreate || createQueue.isPending}>
              <Check className="w-4 h-4 mr-1" /> Criar fila
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
