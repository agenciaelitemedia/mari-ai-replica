import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { ClientForm } from '@/components/admin/clientes/ClientForm';

export const Route = createFileRoute('/_authenticated/clients/new')({
  component: NewClientPage,
});

function NewClientPage() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) {
    return <div className="p-12 text-center"><h1 className="text-2xl font-bold">Acesso Negado</h1></div>;
  }
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      <ClientForm />
    </div>
  );
}
