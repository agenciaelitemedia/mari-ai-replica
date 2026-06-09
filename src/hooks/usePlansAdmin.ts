import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module_ids?: string[];
}

export interface PlanFormData {
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  module_ids: string[];
}

export function usePlansAdmin() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('name');

      if (plansError) throw plansError;

      // Fetch plan_modules for all plans
      const { data: pmData, error: pmError } = await supabase
        .from('plan_modules')
        .select('plan_id, module_id');

      if (pmError) throw pmError;

      // Map module_ids to plans
      return plansData.map(plan => ({
        ...plan,
        module_ids: pmData
          .filter(pm => pm.plan_id === plan.id)
          .map(pm => pm.module_id)
      })) as Plan[];
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: PlanFormData) => {
      const { module_ids, ...rest } = planData;
      
      // 1. Insert plan
      const { data: newPlan, error: planError } = await supabase
        .from('plans')
        .insert(rest)
        .select()
        .single();

      if (planError) throw planError;

      // 2. Insert plan modules
      if (module_ids.length > 0) {
        const planModules = module_ids.map(moduleId => ({
          plan_id: newPlan.id,
          module_id: moduleId
        }));
        const { error: pmError } = await supabase
          .from('plan_modules')
          .insert(planModules);
        if (pmError) throw pmError;
      }

      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano criado com sucesso');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar plano: ' + error.message);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, planData }: { planId: string; planData: PlanFormData }) => {
      const { module_ids, ...rest } = planData;

      // 1. Update plan
      const { error: planError } = await supabase
        .from('plans')
        .update(rest)
        .eq('id', planId);

      if (planError) throw planError;

      // 2. Update plan modules (delete old, insert new)
      const { error: deleteError } = await supabase
        .from('plan_modules')
        .delete()
        .eq('plan_id', planId);

      if (deleteError) throw deleteError;

      if (module_ids.length > 0) {
        const planModules = module_ids.map(moduleId => ({
          plan_id: planId,
          module_id: moduleId
        }));
        const { error: pmError } = await supabase
          .from('plan_modules')
          .insert(planModules);
        if (pmError) throw pmError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano atualizado com sucesso');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir plano: ' + error.message);
    }
  });

  const openCreateDialog = () => {
    setSelectedPlan(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
  };

  return {
    plans,
    isLoading,
    selectedPlan,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createPlan: createPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    deletePlan: deletePlanMutation.mutate,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
  };
}
