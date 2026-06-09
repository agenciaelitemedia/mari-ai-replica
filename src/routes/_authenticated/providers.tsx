import { createFileRoute } from '@tanstack/react-router'
import { ProvidersPanel } from '@/components/admin/providers/ProvidersPanel'

export const Route = createFileRoute('/_authenticated/providers')({
  head: () => ({ meta: [{ title: 'Provedores — MarI.A.' }] }),
  component: ProvidersPage,
})

function ProvidersPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Provedores</h1>
        <p className="text-muted-foreground mt-1">UaZapi, WABA Oficial, Instagram e WebChat</p>
      </header>
      <ProvidersPanel />
    </div>
  )
}
