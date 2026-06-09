import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, User, Globe, Layers } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AppRole, Module } from '@/types/permissions';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: PermissionsMatrixPage,
});

function PermissionsMatrixPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole | 'all'>('admin');
  const [selectedClientId, setSelectedClientId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  // Fetch modules
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

  // Fetch clients
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

  // Fetch default permissions for the selected role
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
    enabled: activeTab === 'roles' && selectedRole !== 'all',
  });

  // Mutation to update role permissions
  const updateRolePermMutation = useMutation({
    mutationFn: async ({ moduleId, field, value }: { moduleId: string; field: string; value: boolean }) => {
      if (selectedRole === 'all') return;

      // First check if it exists
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matriz de Permissões</h1>
          <p className="text-muted-foreground">
            Gerencie o que cada perfil ou usuário pode fazer em cada módulo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/modulos">
              <Layers className="mr-2 h-4 w-4" />
              Gerenciar Módulos
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Por Perfil
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Por Usuário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Configuração por Perfil</CardTitle>
                <CardDescription>
                  Defina as permissões padrão para cada papel do sistema.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Perfil:</span>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingModules || isLoadingRolePerms ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Módulo</th>
                        <th className="text-center p-4 font-medium w-24">Visualizar</th>
                        <th className="text-center p-4 font-medium w-24">Criar</th>
                        <th className="text-center p-4 font-medium w-24">Editar</th>
                        <th className="text-center p-4 font-medium w-24">Excluir</th>
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
                          <tr key={mod.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <div className="font-medium">{mod.name}</div>
                              <div className="text-xs text-muted-foreground">{mod.code}</div>
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox 
                                checked={perm.can_view} 
                                onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_view', perm.can_view)}
                              />
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox 
                                checked={perm.can_create} 
                                onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_create', perm.can_create)}
                              />
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox 
                                checked={perm.can_edit} 
                                onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_edit', perm.can_edit)}
                              />
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox 
                                checked={perm.can_delete} 
                                onCheckedChange={() => handleToggleRolePermission(mod.id, 'can_delete', perm.can_delete)}
                              />
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

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão por Cliente e Usuário</CardTitle>
              <CardDescription>
                Selecione um cliente para gerenciar seus usuários e permissões específicas.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cliente:</span>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               <div className="text-center py-12 text-muted-foreground">
                  Funcionalidade de gestão individual por usuário em desenvolvimento.
                  <br />
                  As permissões estão sendo aplicadas via Perfil por padrão.
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
