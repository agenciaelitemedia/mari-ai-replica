import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProvidersAdmin } from '@/hooks/useProvidersAdmin'
import { ProvidersList } from './ProvidersList'
import { ProviderDialog } from './ProviderDialog'
import { confirmDelete } from '@/lib/swal'

export function ProvidersPanel() {
  const { isSuperAdmin } = useAuth()
  const { providers, isLoading, save, isSaving, remove, test, isTesting } = useProvidersAdmin()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete({ title: 'Excluir provedor?', text: 'A exclusão será bloqueada se houver filas vinculadas.' })
    if (ok) remove(id)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Provedores de canais</CardTitle>
          <CardDescription>
            Configuração global compartilhada entre todos os clientes (apenas superadmin)
          </CardDescription>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Novo provedor
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : (
          <ProvidersList
            providers={providers}
            onEdit={(p) => { setEditing(p); setOpen(true) }}
            onDelete={handleDelete}
            onTest={test}
            isTesting={isTesting}
          />
        )}
      </CardContent>

      <ProviderDialog
        open={open}
        onClose={() => setOpen(false)}
        provider={editing}
        onSave={(data) => save(data, { onSuccess: () => setOpen(false) } as any)}
        isSaving={isSaving}
      />
    </Card>
  )
}
