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
      temporary_password: "",
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
        temporary_password: client.temporary_password || "",
      });
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedPassword = `Maria@${randomNum}`;
      
      form.reset({
        name: "",
        business_name: "",
        email: "",
        phone: "",
        plan_id: null,
        settings: {},
        temporary_password: generatedPassword,
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
      <DialogContent className="max-w-4xl h-[90vh] rounded-3xl border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            Configure as informações detalhadas, plano e permissões do cliente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 flex-1 overflow-y-auto">
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
                      rules={{ required: "Nome é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary/80">Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} className="rounded-xl border-border/60 bg-background/50 h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      rules={{ 
                        required: "Email é obrigatório",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email inválido"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary/80">Email Principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="email@empresa.com" type="email" {...field} className="rounded-xl border-border/60 bg-background/50 h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      rules={{ required: "Telefone é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-primary/80">Telefone / WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} className="rounded-xl border-border/60 bg-background/50 h-12" />
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
                          <FormLabel className="text-sm font-semibold text-primary/80">Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Razão social ou nome fantasia" {...field} className="rounded-xl border-border/60 bg-background/50 h-12" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-primary/80">Usuário / Login</FormLabel>
                        <FormControl>
                          <Input 
                            value={form.watch("email")} 
                            disabled 
                            className="rounded-xl border-border/60 bg-muted/30 h-12 italic" 
                          />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground">O email do cliente será utilizado como login de acesso.</p>
                      </FormItem>

                      <FormField
                        control={form.control}
                        name="temporary_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-primary/80">Senha de Acesso</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  className="rounded-xl border-border/60 bg-background/50 h-12 pr-10 font-mono" 
                                  placeholder="Maria@1234"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  <User className="h-4 w-4" />
                                </div>
                              </div>
                            </FormControl>
                            <p className="text-[10px] text-muted-foreground">Esta senha será mantida até que o usuário realize a alteração.</p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <User className="h-5 w-5" />
                        <h4 className="font-bold">Informações de Acesso</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ao salvar o cliente, um usuário será automaticamente provisionado no sistema com as credenciais acima.
                      </p>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs py-2 border-b border-primary/10">
                          <span className="text-muted-foreground">Tipo de Conta:</span>
                          <span className="font-semibold">Cliente SaaS</span>
                        </div>
                        <div className="flex justify-between text-xs py-2">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="text-emerald-500 font-bold">Aguardando Criação</span>
                        </div>
                      </div>
                    </div>
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
