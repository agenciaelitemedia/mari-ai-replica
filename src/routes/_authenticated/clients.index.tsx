import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientsManagement } from '@/components/admin/clientes/ClientsManagement';

export const Route = createFileRoute('/_authenticated/clients/')({
  component: ClientsPage,
});

function ClientsPage() {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Gestão de <span className="text-gradient">Clientes</span></h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Visualize e gerencie seus clientes e seus respectivos planos.
          </p>
        </div>
      </header>

      <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <ClientsManagement />
        </CardContent>
      </Card>
    </div>
  );
}
