import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Info, LayoutGrid, ShieldAlert } from 'lucide-react'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { useQueuesAdmin } from '@/hooks/useQueuesAdmin'
import { QueuesList } from '@/components/admin/queues/QueuesList'
import { QueueDialog } from '@/components/admin/queues/QueueDialog'
import { confirmDelete } from '@/lib/swal'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_authenticated/queues')({
  head: () => ({ meta: [{ title: 'Filas de Atendimento — MarI.A.' }] }),
  component: QueuesPage,
})

function QueuesPage() {
  const { providers } = useProvidersAdmin()
  const { queues, isLoading, save, isSaving, remove, usage, isUsageLoading } = useQueuesAdmin()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete({ 
      title: 'Excluir fila?', 
      text: 'Esta ação não pode ser desfeita e interromperá os atendimentos vinculados.' 
    })
    if (ok) remove(id)
  }

  const isLimitReached = usage.limit > 0 && usage.current >= usage.limit

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <LayoutGrid className="h-4 w-4" />
            Atendimento
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Filas</h1>
          <p className="text-muted-foreground text-lg">Gerencie seus canais e fluxos de entrada de mensagens.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <Button 
            onClick={() => { setEditing(null); setOpen(true) }} 
            size="lg" 
            className="shadow-xl shadow-primary/20 gap-2 px-6 h-12 text-base font-semibold"
            disabled={isLimitReached}
          >
            <Plus className="h-5 w-5" /> Nova Fila
          </Button>
        </div>
      </header>

      <div className="grid gap-6">
        {/* Usage Card */}
        <Card className="bg-primary/[0.02] border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Info className="h-32 w-32 rotate-12" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Utilização do Plano
              </CardTitle>
              {!isUsageLoading && (
                <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {usage.current} de {usage.limit > 0 ? usage.limit : '∞'} filas
                </span>
              )}
            </div>
            {usage.limit > 0 && (
              <div className="space-y-2">
                <Progress value={(usage.current / usage.limit) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {isLimitReached 
                    ? 'Você atingiu o limite de filas do seu plano atual.' 
                    : `Você ainda pode criar mais ${usage.limit - usage.current} fila(s).`}
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {isLimitReached && (
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Limite atingido</AlertTitle>
            <AlertDescription>
              Para criar novas filas, você precisa remover uma existente ou fazer upgrade do seu plano.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight">Suas Filas Ativas</h2>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed border-muted">
              <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
              <p className="text-muted-foreground font-medium">Carregando filas...</p>
            </div>
          ) : (
            <QueuesList 
              queues={queues} 
              clientsById={{}} // No longer needed as it's isolated by client
              onEdit={(q) => { setEditing(q); setOpen(true) }} 
              onDelete={handleDelete} 
            />
          )}
        </div>
      </div>

      <QueueDialog
        open={open}
        onClose={() => setOpen(false)}
        queue={editing}
        providers={providers}
        onSave={(data) => save(data, { onSuccess: () => setOpen(false) } as any)}
        isSaving={isSaving}
      />
    </div>
  )
}
