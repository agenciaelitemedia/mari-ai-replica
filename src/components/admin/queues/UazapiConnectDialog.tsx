import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Smartphone, User, CheckCircle2 } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { getUazapiQrCode, getUazapiStatus } from '@/lib/providers.functions'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  queueId: string
  queueName: string
}

export function UazapiConnectDialog({ open, onOpenChange, queueId, queueName }: Props) {
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [timer, setTimer] = useState(30)

  const getQr = useServerFn(getUazapiQrCode)
  const getStat = useServerFn(getUazapiStatus)

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [statRes, qrRes] = await Promise.all([
        getStat({ data: { queue_id: queueId } }),
        getQr({ data: { queue_id: queueId } }).catch(() => null)
      ])

      setStatus(statRes)
      if (qrRes?.base64) {
        setQrCode(qrRes.base64)
      } else if (qrRes?.qrcode) {
        setQrCode(qrRes.qrcode)
      } else {
        setQrCode(null)
      }
      
      setTimer(30)
    } catch (e: any) {
      console.error('Error loading UaZapi data:', e)
      if (!silent) toast.error('Erro ao carregar dados da conexão')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadData()
    } else {
      setQrCode(null)
      setStatus(null)
    }
  }, [open, queueId])

  useEffect(() => {
    if (!open || loading) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          loadData(true)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, loading, queueId])

  const isConnected = status?.instance?.state === 'open' || status?.status === 'open' || status?.state === 'open' || status?.response?.instance?.state === 'open'
  const profile = status?.instance?.profile || status?.profile || status?.response?.instance?.profile

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp — {queueName}</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou visualize o status da conexão
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : isConnected ? (
            <div className="w-full space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  {profile?.profilePictureUrl ? (
                    <img 
                      src={profile.profilePictureUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full border-4 border-emerald-500/20 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-500/20">
                      <User className="w-12 h-12 text-emerald-600" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">{profile?.name || 'WhatsApp Conectado'}</h3>
                  <p className="text-muted-foreground">{profile?.number || 'Pronto para uso'}</p>
                </div>

                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1 px-3">
                  Conectado e Ativo
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">Online</p>
                </div>
                <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Bateria</p>
                  <p className="text-sm font-medium">{status?.instance?.battery || '100%'} </p>
                </div>
              </div>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center space-y-6 w-full animate-in fade-in duration-300">
              <div className="relative p-4 bg-white rounded-2xl shadow-sm border">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 opacity-0 hover:opacity-100 transition-opacity">
                   {/* Optional overlay */}
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <RefreshCw className={`w-4 h-4 ${timer < 5 ? 'animate-spin text-orange-500' : 'text-primary'}`} />
                  <span>Atualizando em {timer}s</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos Conectados e aponte a câmera para esta tela.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">QR Code expirado ou indisponível</p>
                <p className="text-xs text-muted-foreground">Tente atualizar para gerar um novo código.</p>
              </div>
              <Button onClick={() => loadData()} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="mt-2 text-[10px] text-center text-muted-foreground bg-muted/50 p-2 rounded-lg">
            A conexão é mantida pela API UaZapi. Se houver problemas, verifique se o celular tem acesso à internet.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!isConnected && (
             <Button variant="outline" size="sm" onClick={() => loadData()}>
               Atualizar agora
             </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
