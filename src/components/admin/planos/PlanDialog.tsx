import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Loader2, ChevronRight, ChevronLeft, Check, Info, Settings, Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(1, 'O nome do plano é obrigatório'),
  description: z.string(),
  price: z.number().min(0, 'O preço deve ser maior ou igual a zero'),
  price_quarterly: z.number().min(0),
  price_semiannual: z.number().min(0),
  price_annual: z.number().min(0),
  is_active: z.boolean(),
  module_ids: z.array(z.string()).min(1, 'Selecione pelo menos um módulo'),
  settings: z.object({
    queues_count: z.number().min(1, 'Mínimo de 1 fila'),
  }).optional(),
});

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (data: PlanFormData) => void;
  isLoading: boolean;
}

type Step = 'basic' | 'settings' | 'modules';

const STEPS = [
  { id: 'basic', title: 'Dados do Plano', icon: Info },
  { id: 'settings', title: 'Configurações', icon: Settings },
  { id: 'modules', title: 'Módulos', icon: Puzzle },
] as const;

export function PlanDialog({ open, onClose, plan, onSave, isLoading }: PlanDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
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
    if (open) {
      setCurrentStep('basic');
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
    }
  }, [plan, form, open]);

  const handleSubmit = (data: PlanFormData) => {
    if (data.module_ids.length === 0) {
      toast.error('Selecione pelo menos um módulo antes de finalizar.');
      return;
    }
    onSave(data);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 'basic') {
      fieldsToValidate = ['name', 'price'];
    } else if (currentStep === 'settings') {
      fieldsToValidate = ['settings.queues_count'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) {
      toast.error('Por favor, preencha os campos obrigatórios corretamente.');
      return;
    }

    if (currentStep === 'basic') setCurrentStep('settings');
    else if (currentStep === 'settings') setCurrentStep('modules');
  };

  const prevStep = () => {
    if (currentStep === 'settings') setCurrentStep('basic');
    else if (currentStep === 'modules') setCurrentStep('settings');
  };

  const toggleModule = (moduleId: string) => {
    const current = form.getValues('module_ids') || [];
    if (current.includes(moduleId)) {
      form.setValue('module_ids', current.filter(id => id !== moduleId), { shouldValidate: true });
    } else {
      form.setValue('module_ids', [...current, moduleId], { shouldValidate: true });
    }
  };

  const toggleAllInCategory = (categoryMods: Module[]) => {
    const current = form.getValues('module_ids') || [];
    const categoryIds = categoryMods.map(m => m.id);
    const allSelected = categoryIds.every(id => current.includes(id));
    
    if (allSelected) {
      // Deselect all in this category
      form.setValue('module_ids', current.filter(id => !categoryIds.includes(id)), { shouldValidate: true });
    } else {
      // Select all in this category (without duplicates)
      const newIds = [...new Set([...current, ...categoryIds])];
      form.setValue('module_ids', newIds, { shouldValidate: true });
    }
  };

  const groupedModules = modules.reduce((acc, mod) => {
    const cat = mod.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mod);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border/40 shadow-2xl backdrop-blur-2xl bg-card/95">
        <DialogHeader className="p-8 border-b border-border/10 bg-linear-to-br from-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
          <div className="relative z-10">
            <DialogTitle className="text-3xl font-black tracking-tight mb-2">
              {plan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-base">
              {plan ? `Editando configurações do plano ${plan.name}` : 'Siga as etapas para criar um novo plano estratégico.'}
            </DialogDescription>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8 relative px-2">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10" 
              style={{ width: currentStep === 'basic' ? '0%' : currentStep === 'settings' ? '50%' : '100%' }}
            />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = idx < STEPS.findIndex(s => s.id === currentStep);
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 group">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg",
                      isActive ? "bg-primary border-primary text-primary-foreground scale-110" : 
                      isCompleted ? "bg-primary/20 border-primary/50 text-primary" : 
                      "bg-card border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="flex min-h-0 flex-col flex-1 overflow-hidden"
          >
            <ScrollArea className="min-h-0 flex-1 p-8">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {currentStep === 'basic' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-primary/70">Nome Comercial</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: MarI.A Premium" {...field} className="h-14 rounded-2xl bg-muted/20 border-border/40 focus:ring-primary/20 transition-all font-semibold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-primary/70">Preço Mensal (R$)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50">R$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus:ring-primary/20 transition-all font-bold"
                                />
                              </div>
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Trimestral (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="h-12 rounded-xl bg-muted/10 border-border/30 focus:ring-primary/20 font-bold"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Semestral (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="h-12 rounded-xl bg-muted/10 border-border/30 focus:ring-primary/20 font-bold"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Anual (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="h-12 rounded-xl bg-muted/10 border-border/30 focus:ring-primary/20 font-bold"
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-xs font-black uppercase tracking-widest text-primary/70">Resumo de Benefícios</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o que torna este plano único..." 
                              className="rounded-2xl bg-muted/20 border-border/40 focus:ring-primary/20 min-h-[120px] transition-all p-5 font-medium leading-relaxed" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-3xl border border-border/30 p-6 bg-linear-to-r from-muted/20 to-transparent">
                          <div className="space-y-1">
                            <FormLabel className="text-lg font-black text-foreground">Disponível para Venda</FormLabel>
                            <FormDescription className="text-sm font-medium text-muted-foreground/80">
                              Ative para permitir que novos clientes contratem este plano.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary scale-125"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 'settings' && (
                  <div className="space-y-8 py-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">Limites & Operação</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl border border-border/30 bg-muted/10 shadow-inner">
                      <FormField
                        control={form.control}
                        name="settings.queues_count"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-primary/70">Filas de Atendimento</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                value={field.value || 1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                className="h-14 rounded-2xl bg-card border-border/40 focus:ring-primary/20 font-black text-xl text-center"
                              />
                            </FormControl>
                            <FormDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">Capacidade máxima de departamentos.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex flex-col justify-center space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-sm font-bold text-primary/80 uppercase tracking-widest">Dica Estratégica</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Aumentar o número de filas agrega valor percebido ao plano, permitindo que empresas maiores organizem melhor seus times.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'modules' && (
                  <div className="space-y-8 py-4">
                    <div className="flex items-center justify-between border-b border-border/10 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Puzzle className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Ecossistema de Módulos</h3>
                      </div>
                      <span className="text-xs font-black px-4 py-2 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                        {form.watch('module_ids')?.length || 0} SELECIONADOS
                      </span>
                    </div>
                    
                    {isLoadingModules ? (
                      <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Carregando módulos...</p>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {Object.entries(groupedModules).map(([category, mods]) => {
                          const categoryIds = mods.map(m => m.id);
                          const currentSelected = form.watch('module_ids') || [];
                          const isCategoryAllSelected = categoryIds.every(id => currentSelected.includes(id));
                          
                          return (
                            <div key={category} className="space-y-4">
                              <div className="flex items-center justify-between px-2">
                                <h4 className="text-xs font-black text-primary/70 uppercase tracking-[0.3em]">{category}</h4>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleAllInCategory(mods)}
                                  className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                                >
                                  {isCategoryAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mods.map((mod) => {
                                  const isSelected = currentSelected.includes(mod.id);
                                  return (
                                    <div
                                      key={mod.id}
                                      className={cn(
                                        "flex items-center space-x-4 p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                                        isSelected
                                          ? "bg-primary/10 border-primary shadow-xl shadow-primary/5"
                                          : "bg-muted/5 border-border/30 hover:bg-muted/10 hover:border-border/60"
                                      )}
                                      onClick={() => toggleModule(mod.id)}
                                    >
                                      {isSelected && (
                                        <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground rounded-bl-xl animate-in zoom-in duration-300">
                                          <Check className="w-3 h-3 stroke-[4px]" />
                                        </div>
                                      )}
                                      <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted/20 text-muted-foreground group-hover:bg-muted/40"
                                      )}>
                                        <Puzzle className="w-6 h-6" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className={cn(
                                          "text-base font-black leading-tight transition-colors block truncate",
                                          isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                          {mod.name}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">
                                          CODE: {mod.code}
                                        </p>
                                      </div>
                                      <div
                                        aria-hidden="true"
                                        className={cn(
                                          "h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                                          isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-transparent border-border/40"
                                        )}
                                      >
                                        {isSelected && <Check className="h-4 w-4 stroke-[3px]" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </ScrollArea>

            <DialogFooter className="p-8 border-t border-border/10 bg-muted/5 backdrop-blur-md flex flex-row items-center justify-between">
              <div>
                {currentStep !== 'basic' && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={prevStep} 
                    className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-6 hover:bg-muted/20"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-6">
                  Cancelar
                </Button>
                
                {currentStep !== 'modules' ? (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-8 bg-linear-to-r from-primary to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-10 bg-linear-to-r from-primary to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4 stroke-[3px]" />}
                    {plan ? 'Finalizar Edição' : 'Criar Plano AGORA'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}