import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Client {
  id: string;
  name: string;
  business_name: string | null;
  federal_id: string | null;
  email: string | null;
  phone: string | null;
  plan_id: string | null;
  settings: any;
  temporary_password: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface ClientFormData {
  name: string;
  business_name?: string;
  federal_id?: string;
  email: string;
  phone: string;
  plan_id?: string | null;
  settings?: any;
}

export function generateTemporaryPassword(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Maria@${n}`;
}

async function isEmailTaken(email: string, ignoreId?: string): Promise<boolean> {
  let q = supabase.from('clients').select('id').eq('email', email).limit(1);
  if (ignoreId) q = q.neq('id', ignoreId);
  const { data, error } = await q;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export function useClientsList() {
  return useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return (data || []) as Client[];
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-client', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Client;
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: ClientFormData) => {
      if (await isEmailTaken(form.email)) {
        throw new Error('Este e-mail já está cadastrado em outro cliente.');
      }
      const payload = {
        ...form,
        plan_id: form.plan_id || null,
        settings: form.settings || {},
        temporary_password: generateTemporaryPassword(),
      };
      const { data, error } = await supabase.from('clients').insert(payload).select().single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success('Cliente criado com sucesso');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientFormData }) => {
      if (await isEmailTaken(data.email, id)) {
        throw new Error('Este e-mail já está cadastrado em outro cliente.');
      }
      const { error } = await supabase
        .from('clients')
        .update({ ...data, plan_id: data.plan_id || null, settings: data.settings || {} })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
      qc.invalidateQueries({ queryKey: ['admin-client', vars.id] });
      toast.success('Cliente atualizado com sucesso');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
