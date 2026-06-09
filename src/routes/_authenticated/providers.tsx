import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { useQueuesAdmin } from '@/hooks/useQueuesAdmin'
import { ProvidersList } from '@/components/admin/providers/ProvidersList'
import { ProviderDialog } from '@/components/admin/providers/ProviderDialog'
import { confirmDelete } from '@/lib/swal'
import { useMemo } from 'react'

export const Route = createFileRoute('/_authenticated/providers')({
  head: () => ({ meta: [{ title: 'Provedores — MarI.A.' }] }),
  component: ProvidersPage,
})

function ProvidersPage() {
  const { isSuperAdmin, profile } = useAuth()
  const defaultClientId = profile?.client_id ?? null
  const { providers, isLoading, save, isSaving, remove, test, isTesting } = useProvidersAdmin()
  const { clients } = useQueuesAdmin()
  const clientsById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete({ title: 'Excluir provedor?', text: 'A exclusão será bloqueada se houver filas vinculadas.' })
    if (ok) remove(id)
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Provedores</h1>
        <p className="text-muted-foreground mt-1">UazAPI, Evolution, WABA Oficial, Instagram e Webchat</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Provedores de canais</CardTitle>
            <CardDescription>Gerencie integrações por cliente</CardDescription>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Novo provedor
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : (
            <ProvidersList
              providers={providers}
              clientsById={clientsById}
              onEdit={(p) => { setEditing(p); setOpen(true) }}
              onDelete={handleDelete}
              onTest={test}
              isTesting={isTesting}
            />
          )}
        </CardContent>
      </Card>

      <ProviderDialog
        open={open}
        onClose={() => setOpen(false)}
        provider={editing}
        clients={clients}
        isSuperAdmin={isSuperAdmin}
        defaultClientId={defaultClientId}
        onSave={(data) => save(data, { onSuccess: () => setOpen(false) } as any)}
        isSaving={isSaving}
      />
    </div>
  )
}
