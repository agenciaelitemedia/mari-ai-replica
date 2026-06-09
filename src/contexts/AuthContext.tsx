import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserPermission } from '@/types/permissions';
import { useQuery } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  profile: any;
  permissions: UserPermission[];
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (moduleCode: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: permissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: ['user-permissions', user?.id, profile?.use_custom_permissions],
    queryFn: async () => {
      if (!user) return [];

      // 1. Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];

      // 2. Get custom permissions if enabled
      if (profile?.use_custom_permissions) {
        const { data: customPerms } = await supabase
          .from('user_permissions')
          .select('*, modules(code, name, category)')
          .eq('user_id', user.id);
        
        if (customPerms) {
          return customPerms.map(p => ({
            module_code: (p.modules as any).code,
            module_name: (p.modules as any).name,
            category: (p.modules as any).category,
            can_view: p.can_view || false,
            can_create: p.can_create || false,
            can_edit: p.can_edit || false,
            can_delete: p.can_delete || false,
          })) as UserPermission[];
        }
      }

      // 3. Get role default permissions
      if (userRoles.length > 0) {
        const { data: rolePerms } = await supabase
          .from('role_default_permissions')
          .select('*, modules(code, name, category)')
          .in('role', userRoles);
        
        if (rolePerms) {
          // Merge permissions if multiple roles (take the most permissive)
          const merged = new Map<string, UserPermission>();
          rolePerms.forEach(p => {
            const code = (p.modules as any).code;
            const existing = merged.get(code);
            if (!existing) {
              merged.set(code, {
                module_code: code,
                module_name: (p.modules as any).name,
                category: (p.modules as any).category,
                can_view: p.can_view || false,
                can_create: p.can_create || false,
                can_edit: p.can_edit || false,
                can_delete: p.can_delete || false,
              });
            } else {
              existing.can_view = existing.can_view || p.can_view || false;
              existing.can_create = existing.can_create || p.can_create || false;
              existing.can_edit = existing.can_edit || p.can_edit || false;
              existing.can_delete = existing.can_delete || p.can_delete || false;
            }
          });
          return Array.from(merged.values());
        }
      }

      return [];
    },
    enabled: !!user && !!profile,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    // Fetch profile and roles in parallel
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', user.id)
    ]);

    if (profileRes.error) console.error('Profile fetch error:', profileRes.error);
    if (rolesRes.error) console.error('Roles fetch error:', rolesRes.error);

    if (profileRes.data) setProfile(profileRes.data);
    if (rolesRes.data) {
      const roles = rolesRes.data.map(r => r.role);
      console.log('User roles loaded:', roles);
      setUserRoles(roles);
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile().then(() => setIsLoading(false));
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, refreshProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
  const isSuperAdmin = userRoles.includes('superadmin');

  const hasPermission = useCallback((moduleCode: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.module_code === moduleCode);
    if (!perm) return false;
    
    switch (action) {
      case 'view': return !!perm.can_view;
      case 'create': return !!perm.can_create;
      case 'edit': return !!perm.can_edit;
      case 'delete': return !!perm.can_delete;
      default: return false;
    }
  }, [permissions, isSuperAdmin]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      permissions,
      isLoading,
      isAdmin,
      isSuperAdmin,
      hasPermission,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
