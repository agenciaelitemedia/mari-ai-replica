import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { WabaEmbeddedSignupButton } from './WabaEmbeddedSignupButton'
import { PROVIDER_TYPES, PROVIDER_LABELS, type ProviderType } from '@/lib/providers.types'

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

export function ProviderDialog({ open, onClose, provider, clients, isSuperAdmin, defaultClientId, onSave, isSaving }: Props) {
  const isEditing = !!provider

  const [clientId, setClientId] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [name, setName] = useState('')
  const [providerType, setProviderType] = useState<ProviderType>('uazapi')
  // UaZapi
  const [evoUrl, setEvoUrl] = useState('')
  const [evoApikey, setEvoApikey] = useState('')
  // WABA
  const [metaAppId, setMetaAppId] = useState('')
  const [metaAppSecret, setMetaAppSecret] = useState('')
  const [wabaBusinessId, setWabaBusinessId] = useState('')
  const [wabaToken, setWabaToken] = useState('')
  // Instagram
  const [instagramPageId, setInstagramPageId] = useState('')
  const [instagramUserId, setInstagramUserId] = useState('')
  const [pageAccessToken, setPageAccessToken] = useState('')
  const [pageName, setPageName] = useState('')

  useEffect(() => {
    if (!open) return
    if (provider) {
      setClientId(provider.client_id || defaultClientId || '')
      setIsActive(!!provider.is_active)
      setName(provider.name || '')
      setProviderType(provider.provider_type as ProviderType)
      setEvoUrl(provider.evo_url || '')
      setEvoApikey(provider.evo_apikey || '')
      setMetaAppId(provider.meta_app_id || '')
      setMetaAppSecret(provider.meta_app_secret || '')
      setWabaBusinessId(provider.waba_business_id || '')
      setWabaToken(provider.waba_token || '')
      setInstagramPageId(provider.instagram_page_id || '')
      setInstagramUserId(provider.instagram_user_id || '')
      setPageAccessToken(provider.page_access_token || '')
      setPageName(provider.page_name || '')
    } else {
      setClientId(defaultClientId || '')
      setIsActive(true)
      setName(''); setProviderType('uazapi')
      setEvoUrl(''); setEvoApikey('')
      setMetaAppId(''); setMetaAppSecret(''); setWabaBusinessId(''); setWabaToken('')
      setInstagramPageId(''); setInstagramUserId(''); setPageAccessToken(''); setPageName('')
    }
  }, [provider, open, defaultClientId])

  const handleSubmit = () => {
    if (!name.trim() || !clientId) return

    const data: Record<string, any> = {
      ...(provider?.id ? { id: provider.id } : {}),
      client_id: clientId,
      name: name.trim(),
      provider_type: providerType,
      is_active: isActive,
    }

    if (providerType === 'uazapi') {
      data.evo_url = evoUrl || null
      data.evo_apikey = evoApikey || null
    } else if (providerType === 'waba') {
      data.meta_app_id = metaAppId || null
      data.meta_app_secret = metaAppSecret || null
      data.waba_business_id = wabaBusinessId || null
      data.waba_token = wabaToken || null
    } else if (providerType === 'instagram') {
      data.instagram_page_id = instagramPageId || null
      data.instagram_user_id = instagramUserId || null
      data.page_access_token = pageAccessToken || null
      data.page_name = pageName || null
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Provedor' : 'Novo Provedor'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as credenciais do provedor.' : 'Configure um novo provedor de comunicação.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Nome do Provedor</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: WhatsApp Principal" />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={providerType} onValueChange={(v) => setProviderType(v as ProviderType)} disabled={isEditing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{PROVIDER_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Ativo</Label>
          </div>

          {providerType === 'uazapi' && (
            <>
              <div>
                <Label>URL da API UaZapi</Label>
                <Input value={evoUrl} onChange={(e) => setEvoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>API Key (Admin Token)</Label>
                <Input value={evoApikey} onChange={(e) => setEvoApikey(e.target.value)} type="password" placeholder="Token de acesso admin" />
              </div>
            </>
          )}

          {providerType === 'waba' && (
            <>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 space-y-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                <div>
                  <p className="text-sm font-medium">Conectar via Meta (recomendado)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use o Embedded Signup oficial. WABA Business ID e token serão preenchidos automaticamente.
                  </p>
                </div>
                <WabaEmbeddedSignupButton
                  onSuccess={({ accessToken, wabaBusinessId: bid }) => {
                    setWabaBusinessId(bid)
                    setWabaToken(accessToken)
                    if (!name.trim()) setName(`WABA ${bid.slice(-6)}`)
                  }}
                />
                {(wabaBusinessId || wabaToken) && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {wabaBusinessId ? `Business ID: ${wabaBusinessId}` : 'Token recebido'}
                  </div>
                )}
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs">Configuração avançada (app próprio)</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div>
                    <Label>Meta App ID</Label>
                    <Input value={metaAppId} onChange={(e) => setMetaAppId(e.target.value)} placeholder="Vazio = usar app global" />
                  </div>
                  <div>
                    <Label>Meta App Secret</Label>
                    <Input value={metaAppSecret} onChange={(e) => setMetaAppSecret(e.target.value)} type="password" placeholder="Vazio = usar app global" />
                  </div>
                  <div>
                    <Label>WABA Business ID (manual)</Label>
                    <Input value={wabaBusinessId} onChange={(e) => setWabaBusinessId(e.target.value)} placeholder="ID da conta WABA" />
                  </div>
                  <div>
                    <Label>Access Token (manual)</Label>
                    <Input value={wabaToken} onChange={(e) => setWabaToken(e.target.value)} type="password" placeholder="Token permanente" />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {providerType === 'instagram' && (
            <>
              <div>
                <Label>Page ID</Label>
                <Input value={instagramPageId} onChange={(e) => setInstagramPageId(e.target.value)} placeholder="ID da página do Facebook" />
              </div>
              <div>
                <Label>Instagram User ID</Label>
                <Input value={instagramUserId} onChange={(e) => setInstagramUserId(e.target.value)} placeholder="ID do usuário Instagram" />
              </div>
              <div>
                <Label>Page Access Token</Label>
                <Input value={pageAccessToken} onChange={(e) => setPageAccessToken(e.target.value)} type="password" placeholder="Token da página" />
              </div>
              <div>
                <Label>Nome da Página</Label>
                <Input value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="Nome exibido" />
              </div>
            </>
          )}

          {providerType === 'webchat' && (
            <div className="p-4 border border-border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                O provedor WebChat utiliza configurações internas do sistema. Apenas o nome é necessário para referência.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !clientId || isSaving}>
            {isSaving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar provedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
