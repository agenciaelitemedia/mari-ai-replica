import { Database } from "@/integrations/supabase/types";

export type AppRole = Database['public']['Enums']['app_role'];

export type ModuleCategory = 'principal' | 'crm' | 'agente' | 'sistema' | 'admin' | 'financeiro';

export type Module = Database['public']['Tables']['modules']['Row'];
export type ModuleCode = string;

export interface UserPermission {
  module_code: string;
  module_name: string;
  category: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface PermissionUpdate {
  moduleCode: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  use_custom_permissions: boolean;
  is_active: boolean;
  client_id: string | null;
  created_at: string;
}

// Permission map for quick lookups
export type PermissionMap = Map<string, UserPermission>;

// Helper to convert array to map
export function createPermissionMap(permissions: UserPermission[]): PermissionMap {
  return new Map(permissions.map(p => [p.module_code, p]));
}

