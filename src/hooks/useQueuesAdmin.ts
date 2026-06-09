import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { listQueuesFull, upsertQueueFull, deleteQueueFull, listClientsForSelect } from '@/lib/providers.functions'

export function useQueuesAdmin(clientId?: string) {
  const qc = useQueryClient()
  const list = useServerFn(listQueuesFull)
  const upsert = useServerFn(upsertQueueFull)
  const remove = useServerFn(deleteQueueFull)
  const listClients = useServerFn(listClientsForSelect)

  const queuesQ = useQuery({
    queryKey: ['queues-full', clientId ?? 'mine'],
    queryFn: () => list({ data: { clientId } }),
  })

  const clientsQ = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => listClients(),
  })

  const save = useMutation({
    mutationFn: (input: any) => upsert({ data: input }),
    onSuccess: () => {
      toast.success('Fila salva')
      qc.invalidateQueries({ queryKey: ['queues-full'] })
      qc.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar'),
  })

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success('Fila excluída')
      qc.invalidateQueries({ queryKey: ['queues-full'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao excluir'),
  })

  return {
    queues: queuesQ.data?.queues ?? [],
    isLoading: queuesQ.isLoading,
    clients: clientsQ.data?.clients ?? [],
    save: save.mutate,
    isSaving: save.isPending,
    remove: del.mutate,
    isRemoving: del.isPending,
  }
}
