import { createFileRoute, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, User, Globe, Layers, Plus, Package } from 'lucide-react';

import { toast } from 'sonner';
import type { AppRole, Module } from '@/types/permissions';
import { ModulesList } from '@/components/admin/modulos/ModulesList';
import { ModuleDialog } from '@/components/admin/modulos/ModuleDialog';
import { useModulesAdmin, type ModuleFormData } from '@/hooks/useModulesAdmin';
import { PlansList } from '@/components/admin/planos/PlansList';
import { PlanDialog } from '@/components/admin/planos/PlanDialog';
import { usePlansAdmin, type PlanFormData } from '@/hooks/usePlansAdmin';
import { ClientsManagement } from '@/components/admin/clientes/ClientsManagement';

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminPage,
});

function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const search = useRouterState({ select: (s) => s.location.search });
  const [activeTab, setActiveTab] = useState<'permissions' | 'modules' | 'plans' | 'clients'>(
    (search as any)?.tab || 'permissions'
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['permissions', 'modules', 'plans', 'clients'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [search]);

  return (
    <div className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Painel <span className="text-gradient">Administrativo</span></h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Central de controle de infraestrutura, módulos e segurança do sistema.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'max-w-2xl grid-cols-4' : 'max-w-md grid-cols-1'} bg-muted/50 p-1.5 h-14 rounded-2xl mb-8`}>
          <TabsTrigger value="permissions" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-md font-bold text-sm">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="modules" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-md font-bold text-sm">
                <Layers className="h-4 w-4" />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-md font-bold text-sm">
                <Package className="h-4 w-4" />
                Planos
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-md font-bold text-sm">
                <User className="h-4 w-4" />
                Clientes
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="permissions" className="mt-6 space-y-6">
          <PermissionsMatrix />
        </TabsContent>

        {isSuperAdmin && (
          <>
            <TabsContent value="modules" className="mt-6 space-y-6">
              <ModulesManagement />
            </TabsContent>

            <TabsContent value="plans" className="mt-6 space-y-6">
              <PlansManagement />
            </TabsContent>

            <TabsContent value="clients" className="mt-6 space-y-6">
              <ClientsManagement />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function PermissionsMatrix() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole | 'all'>('admin');
  const [selectedClientId, setSelectedClientId] = useState<string | 'all'>('all');
  const [matrixTab, setMatrixTab] = useState<'roles' | 'users'>('roles');

  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['admin-modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: rolePermissions = [], isLoading: isLoadingRolePerms } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      if (selectedRole === 'all') return [];
      const { data, error } = await supabase
        .from('role_default_permissions')
        .select('*')
        .eq('role', selectedRole);
      if (error) throw error;
      return data;
    },
    enabled: matrixTab === 'roles' && selectedRole !== 'all',
  });

  const updateRolePermMutation = useMutation({
    mutationFn: async ({ moduleId, field, value }: { moduleId: string; field: string; value: boolean }) => {
      if (selectedRole === 'all') return;
      const { data: existing } = await supabase
        .from('role_default_permissions')
        .select('id')
        .eq('role', selectedRole)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('role_default_permissions')
          .update({ [field]: value } as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_default_permissions')
          .insert({
            role: selectedRole,
            module_id: moduleId,
            [field]: value,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole] });
      toast.success('Permissão atualizada');
    },
  });

  const handleToggleRolePermission = (moduleId: string, field: string, currentValue: boolean) => {
    updateRolePermMutation.mutate({ moduleId, field, value: !currentValue });
  };

  return (
    <Tabs value={matrixTab} onValueChange={(v: any) => setMatrixTab(v)} className="w-full">
      <TabsList className="grid w-full max-w-sm grid-cols-2">
        <TabsTrigger value="roles">Por Perfil</TabsTrigger>
        <TabsTrigger value="users">Por Usuário</TabsTrigger>
      </TabsList>

      <TabsContent value="roles" className="mt-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Configuração por Perfil</CardTitle>
              <CardDescription>Permissões padrão por papel.</CardDescription>
            </div>
            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="colaborador">Colaborador</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoadingModules || isLoadingRolePerms ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4">Módulo</th>
                      <th className="text-center p-4">Ver</th>
                      <th className="text-center p-4">Criar</th>
                      <th className="text-center p-4">Editar</th>
                      <th className="text-center p-4">Excluir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modules.map((mod) => {
                      const permFound = rolePermissions.find(p => p.module_id === mod.id);
                      const perm = {
                        can_view: !!permFound?.can_view,
                        can_create: !!permFound?.can_create,
                        can_edit: !!permFound?.can_edit,
                        can_delete: !!permFound?.can_delete,
                      };
                      return (
                        <tr key={mod.id}>
                          <td className="p-4">
                            <div className="font-medium">{mod.name}</div>
                            <div className="text-xs text-muted-foreground">{mod.code}</div>
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox checked={perm.can_view} onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_view', perm.can_view)} />
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox checked={perm.can_create} onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_create', perm.can_create)} />
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox checked={perm.can_edit} onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_edit', perm.can_edit)} />
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox checked={perm.can_delete} onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_delete', perm.can_delete)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestão por Cliente e Usuário</CardTitle>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[250px] mt-2"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent><div className="py-12 text-center text-muted-foreground">Funcionalidade de gestão individual em desenvolvimento.</div></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ModulesManagement() {
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Módulos do Sistema</CardTitle>
            <CardDescription>Menu dinâmico e funcionalidades.</CardDescription>
          </div>
          <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Novo Módulo</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center h-32"><Loader2 className="animate-spin" /></div>
          ) : (
            <ModulesList modules={modules} onEdit={openEditDialog} onDelete={deleteModule} isDeleting={isDeleting} />
          )}
        </CardContent>
      </Card>
      <ModuleDialog open={isDialogOpen} onClose={closeDialog} module={selectedModule} onSave={handleSave} isLoading={isCreating || isUpdating} />
    </>
  );
}

function PlansManagement() {
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

  const handleSave = (data: PlanFormData) => {
    if (selectedPlan) {
      updatePlan({ planId: selectedPlan.id, planData: data });
    } else {
      createPlan(data);
    }
  };

  return (
    <>
      <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 border-b border-border/10 bg-linear-to-br from-primary/5 to-transparent">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Gestão de Planos</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Defina pacotes de módulos para seus clientes.</CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="rounded-xl font-extrabold px-6 bg-linear-to-r from-primary to-primary/80 hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Novo Plano
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
          ) : (
            <PlansList plans={plans} onEdit={openEditDialog} onDelete={deletePlan} isDeleting={isDeleting} />
          )}
        </CardContent>
      </Card>
      <PlanDialog open={isDialogOpen} onClose={closeDialog} plan={selectedPlan} onSave={handleSave} isLoading={isCreating || isUpdating} />
    </>
  );
}

