import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Client, ClientFormData } from "@/hooks/useClientsAdmin";
import { Loader2, Save, X, Building, Layout, Settings, User } from "lucide-react";

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (data: ClientFormData) => void;
  isLoading: boolean;
}

export function ClientDialog({ open, onClose, client, onSave, isLoading }: ClientDialogProps) {
  const [activeTab, setActiveTab] = useState("data");
  
  const form = useForm<ClientFormData>({
    defaultValues: {
      name: "",
      business_name: "",
      email: "",
      phone: "",
      plan_id: null,
      settings: {},
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name || "",
        business_name: client.business_name || "",
        email: client.email || "",
        phone: client.phone || "",
        plan_id: client.plan_id,
        settings: client.settings || {},
      });
    } else {
      form.reset({
        name: "",
        business_name: "",
        email: "",
        phone: "",
        plan_id: null,
        settings: {},
      });
    }
    setActiveTab("data");
  }, [client, form]);

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans-simple'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('id, name').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = (data: ClientFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl p-0 gap-0">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            Configure as informações detalhadas, plano e permissões do cliente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl mb-6">
                  <TabsTrigger value="data" className="rounded-lg gap-2">
                    <Building className="h-4 w-4" /> Dados
                  </TabsTrigger>
                  <TabsTrigger value="plans" className="rounded-lg gap-2">
                    <Layout className="h-4 w-4" /> Planos
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-lg gap-2">
                    <Settings className="h-4 w-4" /> Config
                  </TabsTrigger>
                  <TabsTrigger value="user" className="rounded-lg gap-2">
                    <User className="h-4 w-4" /> Usuário
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} className="rounded-xl border-border/60 bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Razão social ou nome fantasia" {...field} className="rounded-xl border-border/60 bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Email Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="email@empresa.com" type="email" {...field} className="rounded-xl border-border/60 bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Telefone / WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} className="rounded-xl border-border/60 bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="plans" className="py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="plan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Plano Ativo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-border/60 bg-background/50 h-12">
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/40 backdrop-blur-xl">
                            <SelectItem value="none">Nenhum Plano</SelectItem>
                            {plans.map((plan: any) => (
                              <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary/80">
                    O plano define quais módulos e limites este cliente terá acesso no sistema.
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Configurações técnicas avançadas (JSON).</p>
                    <textarea 
                      className="w-full min-h-[150px] p-4 rounded-xl border-border/60 bg-background/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder='{ "max_users": 5, "features": { "api_access": true } }'
                      value={JSON.stringify(form.watch("settings"), null, 2)}
                      onChange={(e) => {
                        try {
                          form.setValue("settings", JSON.parse(e.target.value));
                        } catch (err) {}
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="user" className="py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-8 text-center border-2 border-dashed border-border/40 rounded-2xl">
                    <User className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground font-medium">Gestão de usuários vinculados ao cliente será liberada na próxima fase.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="p-8 pt-4 bg-muted/20 border-t border-border/40">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 h-11">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl px-8 h-11 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {client ? "Salvar Alterações" : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
