import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  listProviders,
  upsertProvider,
  deleteProvider,
  testProvider,
} from '@/lib/providers.functions'

export function useProvidersAdmin(clientId?: string) {
  const qc = useQueryClient()
  const list = useServerFn(listProviders)
  const upsert = useServerFn(upsertProvider)
  const remove = useServerFn(deleteProvider)
  const test = useServerFn(testProvider)

  const providersQ = useQuery({
    queryKey: ['providers', clientId ?? 'mine'],
    queryFn: () => list({ data: { clientId } }),
  })

  const save = useMutation({
    mutationFn: (input: any) => upsert({ data: input }),
    onSuccess: () => {
      toast.success('Provedor salvo')
      qc.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar'),
  })

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success('Provedor excluído')
      qc.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao excluir'),
  })

  const ping = useMutation({
    mutationFn: (id: string) => test({ data: { id } }),
    onSuccess: (r: any) => {
      if (r.ok) toast.success(`Conexão OK (${r.status})`)
      else toast.error(`Falhou (${r.status}): ${String(r.body).slice(0, 200)}`)
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro no teste'),
  })

  return {
    providers: providersQ.data?.providers ?? [],
    isLoading: providersQ.isLoading,
    save: save.mutate,
    isSaving: save.isPending,
    remove: del.mutate,
    isRemoving: del.isPending,
    test: ping.mutate,
    isTesting: ping.isPending,
  }
}
