import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Module } from '@/types/permissions';

export interface ModuleFormData {
  code: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  route?: string;
  menu_group?: string;
  is_menu_visible: boolean;
  display_order: number;
  is_active: boolean;
}

export function useModulesAdmin() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: modules = [], isLoading, error } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (moduleData: ModuleFormData) => {
      const { data, error } = await supabase
        .from('modules')
        .insert(moduleData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-modules'] });
      toast.success('Módulo criado com sucesso');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar módulo: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ moduleId, moduleData }: { moduleId: string; moduleData: ModuleFormData }) => {
      const { data, error } = await supabase
        .from('modules')
        .update(moduleData)
        .eq('id', moduleId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-modules'] });
      toast.success('Módulo atualizado com sucesso');
      setIsDialogOpen(false);
      setSelectedModule(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar módulo: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from('modules')
        .update({ is_active: false })
        .eq('id', moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-modules'] });
      toast.success('Módulo desativado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar módulo: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setSelectedModule(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (module: Module) => {
    setSelectedModule(module);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedModule(null);
  };

  return {
    modules,
    isLoading,
    error,
    selectedModule,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createModule: createMutation.mutate,
    updateModule: updateMutation.mutate,
    deleteModule: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
