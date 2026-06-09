import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { usePlansAdmin, type PlanFormData } from '@/hooks/usePlansAdmin';
import { PlansList } from '@/components/admin/planos/PlansList';
import { PlanDialog } from '@/components/admin/planos/PlanDialog';

export const Route = createFileRoute('/_authenticated/plans')({
  component: PlansPage,
});

function PlansPage() {
  const { isSuperAdmin } = useAuth();
  const {
    plans,
    isLoading,
    selectedPlan,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createPlan,
    updatePlan,
    deletePlan,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlansAdmin();

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleSave = (data: PlanFormData) => {
    if (selectedPlan) {
      updatePlan({ planId: selectedPlan.id, planData: data });
    } else {
      createPlan(data);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Gestão de <span className="text-gradient">Planos</span></h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Defina pacotes de módulos e funcionalidades para seus clientes.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="rounded-xl font-extrabold px-6 bg-linear-to-r from-primary to-primary/80 hover:scale-105 transition-all shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-5 w-5" /> Novo Plano
        </Button>
      </header>

      <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
          ) : (
            <PlansList plans={plans} onEdit={openEditDialog} onDelete={deletePlan} isDeleting={isDeleting} />
          )}
        </CardContent>
      </Card>
      
      <PlanDialog 
        open={isDialogOpen} 
        onClose={closeDialog} 
        plan={selectedPlan} 
        onSave={handleSave} 
        isLoading={isCreating || isUpdating} 
      />
    </div>
  );
}
