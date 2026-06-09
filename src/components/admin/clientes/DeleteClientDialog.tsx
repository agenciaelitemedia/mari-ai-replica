import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useDeleteClient } from '@/hooks/useClientsAdmin';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface Props {
  clientId: string;
  clientName: string;
  trigger?: React.ReactNode;
}

export function DeleteClientDialog({ clientId, clientName, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [armed, setArmed] = useState(false);
  const del = useDeleteClient();
  const navigate = useNavigate();

  const canDelete = name.trim() === clientName && armed && !del.isPending;

  const handleDelete = async () => {
    await del.mutateAsync(clientId, {
      onSuccess: () => {
        setOpen(false);
        navigate({ to: '/clients' });
      },
    });
  };

  const reset = (v: boolean) => {
    setOpen(v);
    if (!v) { setName(''); setArmed(false); }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" className="rounded-xl">
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Excluir cliente</DialogTitle>
          <DialogDescription className="text-center">
            Esta ação é <strong>permanente</strong> e removerá todos os dados associados a <strong>{clientName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Digite o nome do cliente para confirmar:</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={clientName}
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold">Habilitar exclusão</p>
              <p className="text-xs text-muted-foreground">Ative para liberar o botão de excluir.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={armed}
              onClick={() => setArmed(v => !v)}
              className={cn(
                'relative h-7 w-12 rounded-full transition-colors shrink-0',
                armed ? 'bg-destructive' : 'bg-muted-foreground/30'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform',
                armed && 'translate-x-5'
              )} />
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => reset(false)} className="rounded-xl">Cancelar</Button>
          <Button variant="destructive" disabled={!canDelete} onClick={handleDelete} className="rounded-xl">
            {del.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Deletar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
