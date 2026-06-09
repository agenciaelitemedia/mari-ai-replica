import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { supabase } from '@/integrations/supabase/client'
import {
  listBoards,
  createBoard,
  getBoardData,
  createDeal,
  moveDeal,
} from '@/lib/crm.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Phone, MessageSquare, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/crm')({
  head: () => ({ meta: [{ title: 'CRM — MarI.A' }] }),
  component: CrmPage,
})

function CrmPage() {
  const qc = useQueryClient()
  const fetchBoards = useServerFn(listBoards)
  const createBoardFn = useServerFn(createBoard)

  const [boardId, setBoardId] = useState<string | null>(null)
  const [newBoardName, setNewBoardName] = useState('')
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)

  const boardsQ = useQuery({
    queryKey: ['crm-boards'],
    queryFn: () => fetchBoards(),
  })

  useEffect(() => {
    if (!boardId && boardsQ.data?.boards?.length) {
      setBoardId(boardsQ.data.boards[0].id)
    }
  }, [boardsQ.data, boardId])

  const createBoardM = useMutation({
    mutationFn: (name: string) => createBoardFn({ data: { name } }),
    onSuccess: ({ board }) => {
      toast.success('Quadro criado')
      setBoardDialogOpen(false)
      setNewBoardName('')
      qc.invalidateQueries({ queryKey: ['crm-boards'] })
      setBoardId(board.id)
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao criar quadro'),
  })

  const boards = boardsQ.data?.boards ?? []

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="flex items-center justify-between p-4 border-b gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold">CRM</h1>
          {boards.map((b: any) => (
            <Button
              key={b.id}
              size="sm"
              variant={boardId === b.id ? 'default' : 'outline'}
              onClick={() => setBoardId(b.id)}
            >
              {b.name}
            </Button>
          ))}
        </div>
        <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-4 mr-1" /> Novo quadro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo quadro</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Pipeline de Vendas"
              />
            </div>
            <DialogFooter>
              <Button
                disabled={!newBoardName.trim() || createBoardM.isPending}
                onClick={() => createBoardM.mutate(newBoardName.trim())}
              >
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {boardsQ.isLoading && <p className="p-6 text-muted-foreground">Carregando…</p>}
      {!boardsQ.isLoading && boards.length === 0 && (
        <div className="p-10 text-center text-muted-foreground">
          Nenhum quadro ainda. Crie um para começar.
        </div>
      )}
      {boardId && <KanbanBoard boardId={boardId} />}
    </div>
  )
}

function KanbanBoard({ boardId }: { boardId: string }) {
  const qc = useQueryClient()
  const fetchBoard = useServerFn(getBoardData)
  const createDealFn = useServerFn(createDeal)
  const moveDealFn = useServerFn(moveDeal)

  const boardQ = useQuery({
    queryKey: ['crm-board', boardId],
    queryFn: () => fetchBoard({ data: { boardId } }),
  })

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`crm-board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_deals' }, () =>
        qc.invalidateQueries({ queryKey: ['crm-board', boardId] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_pipelines' }, () =>
        qc.invalidateQueries({ queryKey: ['crm-board', boardId] }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [boardId, qc])

  const moveM = useMutation({
    mutationFn: (v: { dealId: string; toPipelineId: string; toPosition: number }) =>
      moveDealFn({ data: v }),
    onError: (e: any) => {
      toast.error(e?.message ?? 'Falha ao mover')
      qc.invalidateQueries({ queryKey: ['crm-board', boardId] })
    },
  })

  const createDealM = useMutation({
    mutationFn: (v: { pipelineId: string; title: string }) =>
      createDealFn({ data: { boardId, ...v } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-board', boardId] })
      toast.success('Negócio criado')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro'),
  })

  const pipelines = boardQ.data?.pipelines ?? []
  const deals = boardQ.data?.deals ?? []

  const dealsByPipeline = useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const p of pipelines) m[p.id] = []
    for (const d of deals) {
      if (!m[d.pipeline_id]) m[d.pipeline_id] = []
      m[d.pipeline_id].push(d)
    }
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.position - b.position)
    return m
  }, [pipelines, deals])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination, source } = result
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return
    // Optimistic
    qc.setQueryData(['crm-board', boardId], (old: any) => {
      if (!old) return old
      const next = { ...old, deals: [...old.deals] }
      const idx = next.deals.findIndex((d: any) => d.id === draggableId)
      if (idx >= 0) {
        next.deals[idx] = {
          ...next.deals[idx],
          pipeline_id: destination.droppableId,
          position: destination.index,
        }
      }
      return next
    })
    moveM.mutate({
      dealId: draggableId,
      toPipelineId: destination.droppableId,
      toPosition: destination.index,
    })
  }

  if (boardQ.isLoading) return <p className="p-6 text-muted-foreground">Carregando board…</p>

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-w-max h-full">
          {pipelines.map((p: any) => {
            const pDeals = dealsByPipeline[p.id] ?? []
            const total = pDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
            return (
              <div key={p.id} className="w-72 flex flex-col">
                <div
                  className="p-3 rounded-t-md border-b-4"
                  style={{ borderColor: p.color ?? '#888', background: 'hsl(var(--muted))' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {pDeals.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Droppable droppableId={p.id}>
                  {(prov, snap) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.droppableProps}
                      className={`flex-1 p-2 space-y-2 bg-muted/30 rounded-b-md min-h-[200px] transition ${
                        snap.isDraggingOver ? 'bg-muted/60' : ''
                      }`}
                    >
                      {pDeals.map((d, idx) => (
                        <Draggable key={d.id} draggableId={d.id} index={idx}>
                          {(dp, dsnap) => (
                            <Card
                              ref={dp.innerRef}
                              {...dp.draggableProps}
                              {...dp.dragHandleProps}
                              className={`p-3 cursor-grab ${
                                dsnap.isDragging ? 'shadow-lg rotate-1' : ''
                              }`}
                            >
                              <p className="font-medium text-sm truncate">{d.title}</p>
                              {d.contact_name && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {d.contact_name}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                {Number(d.value) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="size-3" />
                                    {Number(d.value).toLocaleString('pt-BR')}
                                  </span>
                                )}
                                {d.contact_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="size-3" />
                                    {d.contact_phone}
                                  </span>
                                )}
                                {d.conversation_id && (
                                  <MessageSquare
                                    className="size-3 text-primary"
                                    aria-label="Vinculado a conversa"
                                  />
                                )}
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                      <NewDealInline
                        onCreate={(title) => createDealM.mutate({ pipelineId: p.id, title })}
                      />
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}

function NewDealInline({ onCreate }: { onCreate: (title: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs text-muted-foreground hover:text-foreground p-2 rounded border border-dashed"
      >
        + Adicionar negócio
      </button>
    )
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) {
          onCreate(title.trim())
          setTitle('')
          setOpen(false)
        }
      }}
      className="space-y-1"
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do negócio"
        className="h-8 text-sm"
        onBlur={() => !title && setOpen(false)}
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-7 text-xs">
          Criar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
