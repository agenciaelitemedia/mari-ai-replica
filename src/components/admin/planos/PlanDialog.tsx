import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plan, PlanFormData } from '@/hooks/usePlansAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Module } from '@/types/permissions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (data: PlanFormData) => void;
  isLoading: boolean;
}

export function PlanDialog({ open, onClose, plan, onSave, isLoading }: PlanDialogProps) {
  const form = useForm<PlanFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      price_quarterly: 0,
      price_semiannual: 0,
      price_annual: 0,
      is_active: true,
      module_ids: [],
      settings: {
        queues_count: 1,
      },
    },
  });

  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['admin-modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('display_order');
      if (error) throw error;
      return data as Module[];
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.price),
        price_quarterly: Number(plan.price_quarterly || 0),
        price_semiannual: Number(plan.price_semiannual || 0),
        price_annual: Number(plan.price_annual || 0),
        is_active: plan.is_active,
        module_ids: plan.module_ids || [],
        settings: {
          queues_count: (plan.settings as any)?.queues_count || 1,
        },
      });
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        price_quarterly: 0,
        price_semiannual: 0,
        price_annual: 0,
        is_active: true,
        module_ids: [],
        settings: {
          queues_count: 1,
        },
      });
    }
  }, [plan, form, open]);

  const handleSubmit = (data: PlanFormData) => {
    onSave(data);
  };

  const toggleModule = (moduleId: string) => {
    const current = form.getValues('module_ids');
    if (current.includes(moduleId)) {
      form.setValue('module_ids', current.filter(id => id !== moduleId));
    } else {
      form.setValue('module_ids', [...current, moduleId]);
    }
  };

  // Group modules by category
  const groupedModules = modules.reduce((acc, mod) => {
    const cat = mod.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mod);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl bg-card/95">
        <DialogHeader className="p-8 border-b border-border/10 bg-linear-to-br from-primary/5 to-transparent">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {plan ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80 font-medium">
            Configure o nome, preço e os módulos disponíveis para este plano.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Nome do Plano</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Premium, Enterprise..." {...field} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Preço Mensal (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price_quarterly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Trimestral (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_semiannual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Semestral (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_annual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Anual (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descrição dos benefícios do plano..." className="rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/40 p-5 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold text-foreground">Status do Plano</FormLabel>
                        <FormDescription className="text-sm font-medium">
                          Indica se o plano está disponível para novas contratações.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-primary">Configurações do Plano</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl border border-border/40 bg-muted/20">
                    <FormField
                      control={form.control}
                      name="settings.queues_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Quantidade de Filas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              className="h-12 rounded-xl bg-card border-border/50 focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] font-medium">Define quantas filas de atendimento este plano permite.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Módulos Inclusos</h3>
                    <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {form.watch('module_ids')?.length || 0} SELECIONADOS
                    </span>
                  </div>
                  
                  <ScrollArea className="h-[560px] w-full pr-4">
                  
                  {isLoadingModules ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedModules).map(([category, mods]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mods.map((mod) => (
                              <div
                                key={mod.id}
                                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                  form.watch('module_ids').includes(mod.id)
                                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                                    : 'bg-muted/10 border-border/30 hover:bg-muted/30'
                                }`}
                                onClick={() => toggleModule(mod.id)}
                              >
                                <Checkbox
                                  checked={form.watch('module_ids').includes(mod.id)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="space-y-0.5">
                                  <label className="text-sm font-bold leading-none cursor-pointer group-hover:text-primary transition-colors">
                                    {mod.name}
                                  </label>
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight truncate max-w-[180px]">
                                    {mod.code}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </ScrollArea>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-8 border-t border-border/10 bg-muted/10 backdrop-blur-sm">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="rounded-xl font-extrabold px-8 bg-linear-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {plan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
