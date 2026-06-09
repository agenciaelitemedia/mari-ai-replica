import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { ModulesList } from '@/components/admin/modulos/ModulesList';
import { ModuleDialog } from '@/components/admin/modulos/ModuleDialog';
import { useModulesAdmin, type ModuleFormData } from '@/hooks/useModulesAdmin';

export const Route = createFileRoute('/_authenticated/admin/modulos')({
  component: ModulosPage,
});

function ModulosPage() {
  const {
    modules,
    isLoading,
    selectedModule,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createModule,
    updateModule,
    deleteModule,
    isCreating,
    isUpdating,
    isDeleting,
  } = useModulesAdmin();

  const handleSave = (data: ModuleFormData) => {
    if (selectedModule) {
      updateModule({ moduleId: selectedModule.id, moduleData: data });
    } else {
      createModule(data);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Módulos</h1>
          <p className="text-muted-foreground">
            Configure os módulos do sistema e suas permissões
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Módulo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os módulos cadastrados para o menu dinâmico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ModulesList
              modules={modules}
              onEdit={openEditDialog}
              onDelete={deleteModule}
              isDeleting={isDeleting}
            />
          )}
        </CardContent>
      </Card>

      <ModuleDialog
        open={isDialogOpen}
        onClose={closeDialog}
        module={selectedModule}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
