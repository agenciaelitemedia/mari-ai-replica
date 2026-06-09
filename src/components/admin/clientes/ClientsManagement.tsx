import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Search, Eye, Mail, Phone, Layout, Building, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useClientsList } from '@/hooks/useClientsAdmin';
import { DeleteClientDialog } from './DeleteClientDialog';
import { useState } from 'react';

export function ClientsManagement() {
  const { data: clients = [], isLoading } = useClientsList();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            className="pl-10 h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild className="w-full md:w-auto h-11 rounded-xl px-6 font-bold">
          <Link to="/clients/new"><UserPlus className="mr-2 h-4 w-4" /> Novo Cliente</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold py-5">Cliente / Empresa</TableHead>
              <TableHead className="font-bold py-5">Contatos</TableHead>
              <TableHead className="font-bold py-5 text-center">Plano</TableHead>
              <TableHead className="font-bold py-5 text-center">Status</TableHead>
              <TableHead className="font-bold py-5 text-right px-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                Nenhum cliente encontrado.
              </TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/20" onClick={() => navigate({ to: '/clients/$id', params: { id: c.id } })}>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{c.name}</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Building className="h-3 w-3" />{c.business_name || 'Pessoa Física'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      {c.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{c.email}</div>}
                      {c.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{c.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {c.plan_id
                      ? <Badge className="bg-primary/10 text-primary border-primary/20"><Layout className="h-3 w-3 mr-1.5" />Ativo</Badge>
                      : <Badge variant="outline">Sem Plano</Badge>}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right px-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10" title="Visualizar">
                        <Link to="/clients/$id" params={{ id: c.id }}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10" title="Editar">
                        <Link to="/clients/$id/edit" params={{ id: c.id }}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <DeleteClientDialog
                        clientId={c.id}
                        clientName={c.name}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
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
