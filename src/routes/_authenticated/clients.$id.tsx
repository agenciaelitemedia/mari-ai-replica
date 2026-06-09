import { createFileRoute, Link, useParams, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/hooks/useClientsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, User, Building2, CreditCard, Copy, Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { maskCpfCnpj, maskPhone, maskCep } from '@/lib/br-utils';

export const Route = createFileRoute('/_authenticated/clients/$id')({
  component: ClientDetailPage,
});

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}:</p>
      <p className="font-semibold">{value || '-'}</p>
    </div>
  );
}

function ClientDetailPage() {
  const { isSuperAdmin } = useAuth();
  const { id } = useParams({ from: '/_authenticated/clients/$id' });
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const [copied, setCopied] = useState(false);

  const { data: plan } = useQuery({
    queryKey: ['plan', client?.plan_id],
    enabled: !!client?.plan_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('*').eq('id', client!.plan_id!).single();
      if (error) throw error;
      return data;
    },
  });

  if (!isSuperAdmin) return <div className="p-12 text-center"><h1 className="text-2xl font-bold">Acesso Negado</h1></div>;
  if (isLoading || !client) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const addr = client.settings?.address || {};
  const cepFmt = addr.cep ? maskCep(addr.cep) : '';
  const fullAddress = [
    addr.street,
    addr.number,
    addr.complement,
    addr.neighborhood,
    [addr.city, addr.state].filter(Boolean).join('/'),
    cepFmt,
  ].filter(Boolean).join(', ');

  const [copyError, setCopyError] = useState(false);
  const copyPwd = async () => {
    if (!client.temporary_password) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(client.temporary_password);
      } else {
        const ta = document.createElement('textarea');
        ta.value = client.temporary_password;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('Falha ao copiar');
      }
      setCopied(true);
      setCopyError(false);
      toast.success('Senha copiada para a área de transferência');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      toast.error('Não foi possível copiar. Copie manualmente.');
      setTimeout(() => setCopyError(false), 2200);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild className="rounded-xl">
          <Link to="/clients"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar à listagem</Link>
        </Button>
        <Button onClick={() => navigate({ to: '/clients/$id/edit', params: { id } })} className="rounded-xl">
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </Button>
      </div>

      <Card className="p-6 rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-5"><User className="h-5 w-5" /> Dados de Acesso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Usuário" value={client.email} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Senha:</p>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-sm">{client.temporary_password || '-'}</code>
              {client.temporary_password && (
                <Button size="icon" variant="ghost" onClick={copyPwd} className="h-8 w-8">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <Field label="Nome do usuário" value={client.name} />
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-5"><Building2 className="h-5 w-5" /> Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Nome" value={client.name} />
          <Field label="Razão Social" value={client.business_name} />
          <Field label="CPF/CNPJ" value={client.federal_id} />
          <Field label="Email" value={client.email} />
          <Field label="Telefone" value={client.phone} />
          <Field label="Endereço" value={fullAddress} />
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-5"><CreditCard className="h-5 w-5" /> Plano e Limites</h2>
        {plan ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Field label="Plano" value={<span className="uppercase">{plan.name}</span>} />
            <Field label="Preço Mensal" value={plan.price ? `R$ ${Number(plan.price).toFixed(2)}` : '-'} />
            <Field label="Status" value={<Badge variant={client.is_active ? 'default' : 'secondary'}>{client.is_active ? 'Ativo' : 'Inativo'}</Badge>} />
            <Field label="Desde" value={client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhum plano vinculado.</p>
        )}
      </Card>
    </div>
  );
}
