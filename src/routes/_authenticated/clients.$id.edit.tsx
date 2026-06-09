import { createFileRoute, useParams } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { ClientForm } from '@/components/admin/clientes/ClientForm';
import { useClient } from '@/hooks/useClientsAdmin';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/clients/$id/edit')({
  component: EditClientPage,
});

function EditClientPage() {
  const { isSuperAdmin } = useAuth();
  const { id } = useParams({ from: '/_authenticated/clients/$id/edit' });
  const { data: client, isLoading } = useClient(id);

  if (!isSuperAdmin) return <div className="p-12 text-center"><h1 className="text-2xl font-bold">Acesso Negado</h1></div>;
  if (isLoading || !client) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      <ClientForm client={client} />
    </div>
  );
}
