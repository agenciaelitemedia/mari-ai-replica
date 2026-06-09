import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Module } from '@/types/permissions';
import { useMemo } from 'react';

export interface MenuModule extends Module {
  icon: string | null;
  route: string | null;
  menu_group: string | null;
  is_menu_visible: boolean | null;
}


export interface GroupedMenuModules {
  [groupName: string]: MenuModule[];
}

export function useMenuModules() {
  const { isAdmin, isSuperAdmin, hasPermission, user, profile } = useAuth();

  const { data: planModules = [], isLoading: isLoadingPlan } = useQuery({
    queryKey: ['client-plan-modules', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id || isSuperAdmin) return null;

      // 1. Get client's plan_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('plan_id')
        .eq('id', profile.client_id)
        .single();
      
      if (clientError || !clientData?.plan_id) return [];

      // 2. Get modules for that plan
      const { data: pmData, error: pmError } = await supabase
        .from('plan_modules')
        .select('module_id')
        .eq('plan_id', clientData.plan_id);

      if (pmError) throw pmError;
      return pmData.map(pm => pm.module_id);
    },
    enabled: !!profile?.client_id || isSuperAdmin,
  });

  const { data: modules = [], isLoading: isLoadingModules, error } = useQuery({
    queryKey: ['menu-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as MenuModule[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const isLoading = isLoadingPlan || isLoadingModules;

  // Filter modules based on permissions and plan
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      // Only show visible modules
      if (mod.is_menu_visible === false) return false;
      
      // Superadmin sees everything
      if (isSuperAdmin) return true;

      // If client has a plan, filter by plan modules
      if (planModules !== null && !planModules.includes(mod.id)) {
        return false;
      }
      
      // Check if user has view permission for this module
      return hasPermission(mod.code, 'view');
    });
  }, [modules, hasPermission, isSuperAdmin, planModules]);

  // Group modules by menu_group
  const groupedModules = useMemo(() => {
    return filteredModules.reduce<GroupedMenuModules>((acc, mod) => {
      const group = mod.menu_group || 'OUTROS';
      if (!acc[group]) acc[group] = [];
      acc[group].push(mod);
      return acc;
    }, {});
  }, [filteredModules]);

  return {
    modules: filteredModules,
    groupedModules,
    isLoading,
    error,
  };
}

export const menuGroupOrder = [
  'PRINCIPAL',
  'CRM',
  'SISTEMA',
  'ADMINISTRATIVO',
  'CONFIGURAÇÕES',
];

export function getSortedGroups(groupedModules: GroupedMenuModules): [string, MenuModule[]][] {
  const entries = Object.entries(groupedModules);
  
  return entries.sort(([groupA], [groupB]) => {
    const indexA = menuGroupOrder.indexOf(groupA);
    const indexB = menuGroupOrder.indexOf(groupB);
    
    // Unknown groups go at the end
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    
    return orderA - orderB;
  });
}
