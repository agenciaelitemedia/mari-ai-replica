import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Module } from '@/types/permissions';

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
  const { isAdmin, hasPermission, user } = useAuth();

  const { data: modules = [], isLoading, error } = useQuery({
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
  });

  // Filter modules based on permissions
  const filteredModules = modules.filter((mod) => {
    // Only show visible modules
    if (mod.is_menu_visible === false) return false;
    
    // Check if user has view permission for this module
    // If it's superadmin, hasPermission will return true
    return hasPermission(mod.code, 'view');
  });

  // Group modules by menu_group
  const groupedModules = filteredModules.reduce<GroupedMenuModules>((acc, mod) => {
    const group = mod.menu_group || 'OUTROS';
    if (!acc[group]) acc[group] = [];
    acc[group].push(mod);
    return acc;
  }, {});

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
