import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface Client {
  id: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  plan_id: string | null;
  settings: any;
  created_at: string | null;
}

export interface ClientFormData {
  name: string;
  business_name: string;
  email: string;
  phone: string;
  plan_id: string | null;
  settings: any;
}

export function useClientsAdmin() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente criado com sucesso');
      setIsDialogOpen(false);
    },
    onError: (error: any) => toast.error('Erro: ' + error.message)
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: ClientFormData }) => {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente atualizado com sucesso');
      setIsDialogOpen(false);
    },
    onError: (error: any) => toast.error('Erro: ' + error.message)
  });

  return {
    clients,
    isLoading,
    isDialogOpen,
    selectedClient,
    openCreateDialog: () => { setSelectedClient(null); setIsDialogOpen(true); },
    openEditDialog: (client: Client) => { setSelectedClient(client); setIsDialogOpen(true); },
    closeDialog: () => setIsDialogOpen(false),
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    isProcessing: createClientMutation.isPending || updateClientMutation.isPending
  };
}
