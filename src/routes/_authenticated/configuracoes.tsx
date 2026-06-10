import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { ProvidersPanel } from '@/components/admin/providers/ProvidersPanel'
import { QueuesPanel } from '@/components/admin/queues/QueuesPanel'

export const Route = createFileRoute('/_authenticated/configuracoes')({
  head: () => ({ meta: [{ title: 'Configurações — MarI.A.' }] }),
  component: SettingsPage,
})

function SettingsPage() {
  const { providers } = useProvidersAdmin()

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID
  const base = `https://project--${projectId}.lovable.app/api/public/webhooks`

  const copy = (s: string) => {
    navigator.clipboard.writeText(s)
    toast.success('Copiado!')
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Provedores, filas de atendimento e webhooks</p>
      </header>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="providers" className="rounded-xl px-4">Provedores</TabsTrigger>
          <TabsTrigger value="queues" className="rounded-xl px-4">Filas</TabsTrigger>
          <TabsTrigger value="webhooks" className="rounded-xl px-4">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <ProvidersPanel />
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          <QueuesPanel />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          {providers.map((p: any) => {
            const url =
              p.provider_type === 'uazapi' ? `${base}/uazapi?queue_id=<ID_DA_FILA>&token=${p.evo_apikey ?? ''}` :
              p.provider_type === 'waba' ? `${base}/waba?provider_id=${p.id}` :
              p.provider_type === 'instagram' ? `${base}/instagram?provider_id=${p.id}` :
              `${base}/webchat?key=${p.widget_key ?? ''}`
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>{p.provider_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted rounded-lg p-2 break-all">{url}</code>
                    <Button size="sm" variant="outline" onClick={() => copy(url)}><Copy className="h-4 w-4" /></Button>
                  </div>
                  {p.provider_type === 'webchat' && p.widget_key && (
                    <pre className="text-xs bg-muted rounded-lg p-2 overflow-x-auto">{`<script src="${base.replace('/webhooks','')}/widget.js?key=${p.widget_key}"></script>`}</pre>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {providers.length === 0 && (
            <p className="text-sm text-muted-foreground p-8 text-center">Cadastre um provedor para ver as URLs de webhook.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
