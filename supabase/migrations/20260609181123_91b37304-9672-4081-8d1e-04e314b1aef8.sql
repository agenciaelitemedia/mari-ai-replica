-- 1. Tabela de Clientes (Multi-tenant)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT,
  federal_id TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  photo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Atualização da tabela profiles para suportar client_id e permissões
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS use_custom_permissions BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Tabela de Módulos
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  route TEXT,
  menu_group TEXT,
  is_menu_visible BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  module_type TEXT DEFAULT 'native',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Permissões por Papel (Default)
CREATE TABLE public.role_default_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module_id)
);

-- 5. Tabela de Permissões por Usuário (Override)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 6. Tabela de Embeds de Módulos
CREATE TABLE public.module_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID UNIQUE NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  embed_url TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_default_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_embeds TO authenticated;

GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.role_default_permissions TO service_role;
GRANT ALL ON public.user_permissions TO service_role;
GRANT ALL ON public.module_embeds TO service_role;

-- 8. Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_default_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_embeds ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Temporariamente permitindo tudo para usuários autenticados para facilitar a migração, mas o ideal seria filtrar por client_id
CREATE POLICY "Allow all to authenticated on clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated on modules" ON public.modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated on role_default_permissions" ON public.role_default_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated on user_permissions" ON public.user_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated on module_embeds" ON public.module_embeds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Inserir Módulos Iniciais
INSERT INTO public.modules (code, name, category, icon, route, menu_group, display_order) VALUES
('dashboard', 'Dashboard', 'principal', 'LayoutDashboard', '/', 'PRINCIPAL', 1),
('crm_leads', 'Leads', 'crm', 'Users', '/crm/leads', 'CRM', 10),
('crm_pipeline', 'Pipeline', 'crm', 'GitBranch', '/crm', 'CRM', 11),
('chat', 'Chat', 'principal', 'MessageSquare', '/chat', 'PRINCIPAL', 2),
('team', 'Equipe', 'sistema', 'Users2', '/equipe', 'SISTEMA', 30),
('admin_modules', 'Módulos', 'admin', 'Layers', '/admin/modulos', 'ADMINISTRATIVO', 40),
('admin_permissions', 'Permissões', 'admin', 'ShieldCheck', '/admin/permissoes', 'ADMINISTRATIVO', 41),
('settings', 'Configurações', 'admin', 'Settings', '/settings', 'CONFIGURAÇÕES', 50)
ON CONFLICT (code) DO NOTHING;

-- 11. Inserir Permissões Padrão para Papéis (Usando os IDs dos módulos inseridos acima)
DO $$
DECLARE
  v_mod_id UUID;
BEGIN
  -- Superadmin e Admin ganham tudo
  FOR v_mod_id IN SELECT id FROM public.modules LOOP
    INSERT INTO public.role_default_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
    VALUES ('superadmin', v_mod_id, TRUE, TRUE, TRUE, TRUE),
           ('admin', v_mod_id, TRUE, TRUE, TRUE, TRUE)
    ON CONFLICT (role, module_id) DO NOTHING;
  END LOOP;
  
  -- Time (View only)
  FOR v_mod_id IN SELECT id FROM public.modules WHERE category IN ('principal', 'crm') LOOP
    INSERT INTO public.role_default_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
    VALUES ('time', v_mod_id, TRUE, FALSE, FALSE, FALSE)
    ON CONFLICT (role, module_id) DO NOTHING;
  END LOOP;
END $$;
