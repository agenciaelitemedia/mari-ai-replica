import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Search, Edit3, Trash2, Globe, Phone, Mail, Layout, Building } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useClientsAdmin, ClientFormData } from '@/hooks/useClientsAdmin';
import { ClientDialog } from './ClientDialog';
import { useState } from 'react';

export function ClientsManagement() {
  const {
    clients,
    isLoading,
    isDialogOpen,
    selectedClient,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createClient,
    updateClient,
    isProcessing
  } = useClientsAdmin();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (data: ClientFormData) => {
    if (selectedClient) {
      updateClient({ id: selectedClient.id, data });
    } else {
      createClient(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome, empresa ou email..." 
            className="pl-10 h-11 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto h-11 rounded-xl px-6 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all font-bold">
          <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="font-bold py-5">Cliente / Empresa</TableHead>
              <TableHead className="font-bold py-5">Contatos</TableHead>
              <TableHead className="font-bold py-5 text-center">Plano</TableHead>
              <TableHead className="font-bold py-5 text-center">Status</TableHead>
              <TableHead className="font-bold py-5 text-right px-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                    <p className="text-sm text-muted-foreground font-medium">Carregando base de clientes...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/20 border-border/40 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-base">{client.name}</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Building className="h-3 w-3" />
                        {client.business_name || "Pessoa Física"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {client.plan_id ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full font-bold">
                        <Layout className="h-3 w-3 mr-1.5" /> 
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-medium rounded-full">
                        Sem Plano
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right px-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(client)}
                      className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientDialog 
        open={isDialogOpen} 
        onClose={closeDialog} 
        client={selectedClient} 
        onSave={handleSave} 
        isLoading={isProcessing} 
      />
    </div>
  );
}
