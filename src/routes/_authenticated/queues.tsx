import { createFileRoute } from '@tanstack/react-router'
import { QueuesPanel } from '@/components/admin/queues/QueuesPanel'

export const Route = createFileRoute('/_authenticated/queues')({
  head: () => ({ meta: [{ title: 'Filas de Atendimento — MarI.A.' }] }),
  component: QueuesPage,
})

function QueuesPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
      <QueuesPanel />
    </div>
  )
}
