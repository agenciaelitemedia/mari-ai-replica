import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  listQueuesFull,
  createQueueFull,
  updateQueueFull,
  deleteQueueFull,
  restoreQueueFull,
  countActiveConversations,
  getQueuesUsage,
} from '@/lib/providers.functions'

export interface Queue {
  id: string
  client_id: string
  name: string
  channel_type: 'uazapi' | 'waba' | 'instagram' | 'webchat'
  provider_id: string | null
  evo_url: string | null
  evo_apikey: string | null
  evo_instance: string | null
  waba_id: string | null
  waba_token: string | null
  waba_number_id: string | null
  phone_number: string | null
  phone_resolved_at: string | null
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  settings: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  provider?: { id: string; name: string; provider_type: string; is_active: boolean } | null
}

export function useQueues(includeDeleted = false) {
  const list = useServerFn(listQueuesFull)
  return useQuery({
    queryKey: ['queues', includeDeleted],
    queryFn: async () => {
      const r = await list({ data: { include_deleted: includeDeleted } })
      return (r.queues ?? []) as Queue[]
    },
  })
}

export function useQueuesUsage() {
  const getUsage = useServerFn(getQueuesUsage)
  return useQuery({
    queryKey: ['queues-usage'],
    queryFn: () => getUsage(),
  })
}

export function useActiveConversationCount(queueId: string | null, enabled: boolean) {
  const count = useServerFn(countActiveConversations)
  return useQuery({
    queryKey: ['queue-active-count', queueId],
    queryFn: () => count({ data: { queue_id: queueId! } }),
    enabled: !!queueId && enabled,
  })
}

export function useQueueMutations() {
  const qc = useQueryClient()
  const create = useServerFn(createQueueFull)
  const update = useServerFn(updateQueueFull)
  const remove = useServerFn(deleteQueueFull)
  const restore = useServerFn(restoreQueueFull)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['queues'] })
    qc.invalidateQueries({ queryKey: ['queues-usage'] })
  }

  const createQueue = useMutation({
    mutationFn: (input: any) => create({ data: input }),
    onSuccess: () => { toast.success('Fila criada com sucesso'); invalidate() },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao criar fila'),
  })

  const updateQueue = useMutation({
    mutationFn: (input: any) => update({ data: input }),
    onSuccess: () => { toast.success('Fila atualizada'); invalidate() },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao atualizar'),
  })

  const deleteQueue = useMutation({
    mutationFn: (input: { queue_id: string; migrate_to_queue_id?: string; force?: boolean }) =>
      remove({ data: input }),
    onSuccess: () => { toast.success('Fila excluída'); invalidate() },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao excluir'),
  })

  const restoreQueue = useMutation({
    mutationFn: (input: { queue_id: string; migrate_to_queue_id?: string }) =>
      restore({ data: input }),
    onSuccess: (_d, vars) => {
      toast.success(vars.migrate_to_queue_id ? 'Conversas migradas para a fila restaurada' : 'Fila restaurada')
      invalidate()
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao restaurar'),
  })

  return { createQueue, updateQueue, deleteQueue, restoreQueue }
}
