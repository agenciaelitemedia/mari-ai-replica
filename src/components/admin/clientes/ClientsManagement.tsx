import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function ClientsManagement() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['admin-clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, plans(name)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const updateClientPlanMutation = useMutation({
    mutationFn: async ({ clientId, planId }: { clientId: string; planId: string | null }) => {
      const { error } = await supabase
        .from('clients')
        .update({ plan_id: planId === 'none' ? null : planId })
        .eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients-list'] });
      toast.success('Plano do cliente atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Email / Contato</TableHead>
              <TableHead>Plano Atual</TableHead>
              <TableHead className="w-[250px]">Alterar Plano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingClients ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="animate-spin inline-block mr-2" /> Carregando clientes...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.business_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.email || '-'}</div>
                    <div className="text-xs text-muted-foreground">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    {client.plans?.name ? (
                      <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">
                        {client.plans.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Sem Plano</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={client.plan_id || 'none'}
                      onValueChange={(val) => updateClientPlanMutation.mutate({ clientId: client.id, planId: val })}
                    >
                      <SelectTrigger className="h-9 rounded-lg">
                        <SelectValue placeholder="Selecionar plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum Plano</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
