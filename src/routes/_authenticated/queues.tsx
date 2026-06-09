import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { useQueuesAdmin } from '@/hooks/useQueuesAdmin'
import { QueuesList } from '@/components/admin/queues/QueuesList'
import { QueueDialog } from '@/components/admin/queues/QueueDialog'
import { confirmDelete } from '@/lib/swal'

export const Route = createFileRoute('/_authenticated/queues')({
  head: () => ({ meta: [{ title: 'Filas — MarI.A.' }] }),
  component: QueuesPage,
})

function QueuesPage() {
  const { isSuperAdmin, profile } = useAuth()
  const defaultClientId = profile?.client_id ?? null
  const { providers } = useProvidersAdmin()
  const { queues, isLoading, clients, save, isSaving, remove } = useQueuesAdmin()
  const clientsById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete({ title: 'Excluir fila?', text: 'Esta ação não pode ser desfeita.' })
    if (ok) remove(id)
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Filas</h1>
        <p className="text-muted-foreground mt-1">Filas de atendimento vinculadas a provedores</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Filas de atendimento</CardTitle>
            <CardDescription>Liberadas por cliente conforme limites do plano</CardDescription>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Nova fila
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : (
            <QueuesList queues={queues} clientsById={clientsById} onEdit={(q) => { setEditing(q); setOpen(true) }} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      <QueueDialog
        open={open}
        onClose={() => setOpen(false)}
        queue={editing}
        providers={providers}
        clients={clients}
        isSuperAdmin={isSuperAdmin}
        defaultClientId={defaultClientId}
        onSave={(data) => save(data, { onSuccess: () => setOpen(false) } as any)}
        isSaving={isSaving}
      />
    </div>
  )
}
