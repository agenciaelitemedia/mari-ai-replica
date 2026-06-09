import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { AppRole, UserPermission } from '@/types/permissions';

export const Route = createFileRoute('/_authenticated/admin/permissoes' as any)({
  component: PermissionsPage,
});

function PermissionsPage() {
  const queryClient = useQueryClient();
  const roles: AppRole[] = ['superadmin', 'admin', 'colaborador', 'user', 'time'];

  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('modules').select('*').eq('is_active', true).order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: rolePermissions = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ['admin-role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_default_permissions').select('*');
      if (error) throw error;
      return data;
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ role, moduleId, field, value }: { role: AppRole; moduleId: string; field: string; value: boolean }) => {
      const existing = rolePermissions.find(p => p.role === role && p.module_id === moduleId);
      
      if (existing) {
        const { error } = await supabase
          .from('role_default_permissions')
          .update({ [field]: value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_default_permissions')
          .insert({
            role,
            module_id: moduleId,
            [field]: value
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
      toast.success('Permissão atualizada');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const togglePermission = (role: AppRole, moduleId: string, field: string, currentValue: boolean) => {
    updatePermissionMutation.mutate({ role, moduleId, field, value: !currentValue });
  };

  if (isLoadingModules || isLoadingPerms) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1>
        <p className="text-muted-foreground">Configure as permissões padrão para cada papel do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>Defina o que cada papel pode fazer em cada módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin">
            <TabsList>
              {roles.map(role => (
                <TabsTrigger key={role} value={role} className="capitalize">
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>

            {roles.map(role => (
              <TabsContent key={role} value={role} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Módulo</TableHead>
                        <TableHead className="text-center">Visualizar</TableHead>
                        <TableHead className="text-center">Criar</TableHead>
                        <TableHead className="text-center">Editar</TableHead>
                        <TableHead className="text-center">Excluir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map(module => {
                        const perm = rolePermissions.find(p => p.role === role && p.module_id === module.id) || {
                          can_view: false,
                          can_create: false,
                          can_edit: false,
                          can_delete: false
                        };

                        return (
                          <TableRow key={module.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{module.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{module.code}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={perm.can_view || false} 
                                onCheckedChange={() => togglePermission(role, module.id, 'can_view', !!perm.can_view)}
                                disabled={role === 'superadmin'}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={perm.can_create || false} 
                                onCheckedChange={() => togglePermission(role, module.id, 'can_create', !!perm.can_create)}
                                disabled={role === 'superadmin'}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={perm.can_edit || false} 
                                onCheckedChange={() => togglePermission(role, module.id, 'can_edit', !!perm.can_edit)}
                                disabled={role === 'superadmin'}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={perm.can_delete || false} 
                                onCheckedChange={() => togglePermission(role, module.id, 'can_delete', !!perm.can_delete)}
                                disabled={role === 'superadmin'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
