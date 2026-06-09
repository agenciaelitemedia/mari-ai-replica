import { useState } from 'react';
import { useDeleteClient } from '@/hooks/useClientsAdmin';
import { useNavigate } from '@tanstack/react-router';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  clientId: string;
  clientName: string;
  trigger?: React.ReactNode;
}

export function DeleteClientDialog({ clientId, clientName, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const del = useDeleteClient();
  const navigate = useNavigate();

  const handleDelete = async () => {
    await del.mutateAsync(clientId, {
      onSuccess: () => {
        setOpen(false);
        navigate({ to: '/clients' });
      },
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          variant="destructive" 
          onClick={() => setOpen(true)}
          className="rounded-xl"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </Button>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir ${clientName}? Esta ação removerá todos os dados permanentemente.`}
        onConfirm={handleDelete}
        confirmText="Sim, Deletar Permanentemente"
        cancelText="Não, Cancelar"
        isLoading={del.isPending}
      />
    </>
  );
}
