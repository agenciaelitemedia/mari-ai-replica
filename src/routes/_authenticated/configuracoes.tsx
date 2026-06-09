import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listQueues, upsertQueue } from '@/lib/chat.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/configuracoes')({
  component: SettingsPage,
})

function SettingsPage() {
  const qc = useQueryClient()
  const fetchQueues = useServerFn(listQueues)
  const upsert = useServerFn(upsertQueue)

  const queuesQ = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchQueues(),
  })

  const [form, setForm] = useState({
    client_id: '',
    name: '',
    evo_url: '',
    evo_apikey: '',
    evo_instance: '',
    phone_number: '',
  })

  const create = useMutation({
    mutationFn: () => upsert({ data: form }),
    onSuccess: ({ queue }) => {
      toast.success(`Instância "${queue.name}" salva`)
      setForm({ client_id: '', name: '', evo_url: '', evo_apikey: '', evo_instance: '', phone_number: '' })
      qc.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar'),
  })

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID
  const webhookBase = `https://project--${projectId}.lovable.app/api/public/webhooks/uazapi`

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Instâncias de WhatsApp (UazAPI)</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Nova instância UazAPI</h2>
        <form
          className="grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          {(
            [
              ['client_id', 'Client ID', 'ex: cliente-001'],
              ['name', 'Nome da fila', 'Atendimento Principal'],
              ['evo_url', 'URL do servidor UazAPI', 'https://seu-servidor.uazapi.com'],
              ['evo_apikey', 'Token (API key)', 'token gerado pela UazAPI'],
              ['evo_instance', 'Instance ID', 'ex: minha-instancia'],
              ['phone_number', 'Número (somente dígitos)', '5511999999999'],
            ] as const
          ).map(([k, label, ph]) => (
            <div key={k} className={k === 'evo_url' || k === 'evo_apikey' ? 'col-span-2' : ''}>
              <Label htmlFor={k}>{label}</Label>
              <Input
                id={k}
                value={(form as any)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={ph}
              />
            </div>
          ))}
          <div className="col-span-2 flex justify-end">
            <Button type="submit" disabled={create.isPending || !form.name || !form.client_id}>
              {create.isPending ? 'Salvando…' : 'Salvar instância'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">Webhook UazAPI</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Configure no painel da UazAPI o seguinte URL para receber mensagens. Inclua o <code>queue_id</code> e o
          <code> token</code> (mesmo valor do campo "Token").
        </p>
        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`${webhookBase}?queue_id=<ID_DA_FILA>&token=<TOKEN>`}
        </pre>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Instâncias configuradas</h2>
        {queuesQ.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {queuesQ.data?.queues?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma instância ainda.</p>
        )}
        <div className="space-y-2">
          {queuesQ.data?.queues?.map((q: any) => (
            <div key={q.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <p className="font-medium">{q.name}</p>
                <p className="text-xs text-muted-foreground">
                  {q.evo_instance ?? '—'} • {q.phone_number ?? 'sem número'} • {q.is_active ? 'ativa' : 'inativa'}
                </p>
              </div>
              <code className="text-[10px] text-muted-foreground">{q.id}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
