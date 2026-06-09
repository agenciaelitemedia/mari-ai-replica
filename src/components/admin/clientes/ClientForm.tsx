import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, ClientFormData, useCreateClient, useUpdateClient } from '@/hooks/useClientsAdmin';
import { Loader2, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  maskCep, maskCpfCnpj, maskPhone, onlyDigits, isValidCpfCnpj, lookupCep,
} from '@/lib/br-utils';

const schema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(120),
  business_name: z.string().trim().max(160).optional().or(z.literal('')),
  federal_id: z.string().optional().or(z.literal('')).refine(
    (v) => !v || isValidCpfCnpj(v),
    { message: 'CPF/CNPJ inválido' }
  ),
  email: z.string().trim().email('E-mail inválido').max(255),
  phone: z.string().trim().min(8, 'Telefone obrigatório').max(20),
  plan_id: z.string().optional().nullable(),
  address: z.object({
    cep: z.string().optional().or(z.literal('')),
    street: z.string().optional().or(z.literal('')),
    number: z.string().optional().or(z.literal('')),
    complement: z.string().optional().or(z.literal('')),
    neighborhood: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
  }),
});

type FormValues = z.infer<typeof schema>;

interface Props { client?: Client | null }

export function ClientForm({ client }: Props) {
  const navigate = useNavigate();
  const create = useCreateClient();
  const update = useUpdateClient();
  const isEdit = !!client;
  const [cepLoading, setCepLoading] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans-simple'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('id, name').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? '',
      business_name: client?.business_name ?? '',
      federal_id: client?.federal_id ? maskCpfCnpj(client.federal_id) : '',
      email: client?.email ?? '',
      phone: client?.phone ? maskPhone(client.phone) : '',
      plan_id: client?.plan_id ?? null,
      address: {
        cep: client?.settings?.address?.cep ?? '',
        street: client?.settings?.address?.street ?? '',
        number: client?.settings?.address?.number ?? '',
        complement: client?.settings?.address?.complement ?? '',
        neighborhood: client?.settings?.address?.neighborhood ?? '',
        city: client?.settings?.address?.city ?? '',
        state: client?.settings?.address?.state ?? '',
      },
    },
  });

  const handleCepBlur = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await lookupCep(d);
      form.setValue('address.street', r.logradouro || '', { shouldDirty: true });
      form.setValue('address.neighborhood', r.bairro || '', { shouldDirty: true });
      form.setValue('address.city', r.localidade || '', { shouldDirty: true });
      form.setValue('address.state', r.uf || '', { shouldDirty: true });
      toast.success('Endereço preenchido pelo CEP');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao consultar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  const onSubmit = async (v: FormValues) => {
    const payload: ClientFormData = {
      name: v.name,
      business_name: v.business_name || undefined,
      federal_id: v.federal_id ? onlyDigits(v.federal_id) : undefined,
      email: v.email,
      phone: onlyDigits(v.phone),
      plan_id: v.plan_id || null,
      settings: { ...(client?.settings || {}), address: { ...v.address, cep: onlyDigits(v.address.cep || '') } },
    };
    if (isEdit && client) {
      await update.mutateAsync({ id: client.id, data: payload },
        { onSuccess: () => navigate({ to: '/clients/$id', params: { id: client.id } }) });
    } else {
      await create.mutateAsync(payload, {
        onSuccess: (c) => navigate({ to: '/clients/$id', params: { id: c.id } }),
      });
    }
  };

  const isLoading = create.isPending || update.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados do {isEdit ? 'cliente' : 'novo cliente'}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/clients' })} className="rounded-xl">
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
        </div>

        <Card className="p-6 rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="business_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Escritório</FormLabel>
                <FormControl><Input placeholder="Razão social (opcional)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="federal_id" render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                    inputMode="numeric"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail *</FormLabel>
                <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(00) 00000-0000"
                    {...field}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    inputMode="numeric"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address.cep" render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => field.onChange(maskCep(e.target.value))}
                      onBlur={(e) => { field.onBlur(); handleCepBlur(e.target.value); }}
                      inputMode="numeric"
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.street" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Logradouro</FormLabel>
                <FormControl><Input placeholder="Rua, Avenida, etc." {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.number" render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl><Input placeholder="Número" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.complement" render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl><Input placeholder="Apt, Sala, etc." {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.neighborhood" render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl><Input placeholder="Bairro" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.city" render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="address.state" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="plan_id" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Plano</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === 'none' ? null : v)} value={field.value || 'none'}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum plano</SelectItem>
                    {plans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/clients' })} className="rounded-xl">Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="rounded-xl">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEdit ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
