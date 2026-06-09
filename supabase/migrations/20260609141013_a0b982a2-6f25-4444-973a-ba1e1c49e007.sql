
-- ============================================================
-- MarI.A — Foundation migration (Phase 1)
-- Auth (profiles + roles) + core appjulia tables (chat + CRM + datajud)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1) APP ROLES + PROFILES (Lovable auth foundation)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'agent', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cod_agent TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- update_updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + cod_agent on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, cod_agent)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'AG' || substr(replace(NEW.id::text, '-', ''), 1, 10)
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2) CHAT FOUNDATION (chat_contacts + chat_messages)
-- ============================================================
CREATE TABLE public.chat_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  cod_agent TEXT,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_contacts TO authenticated;
GRANT ALL ON public.chat_contacts TO service_role;
ALTER TABLE public.chat_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_contacts all authenticated" ON public.chat_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_chat_contacts_client ON public.chat_contacts(client_id);
CREATE INDEX idx_chat_contacts_phone ON public.chat_contacts(phone);
CREATE INDEX idx_chat_contacts_cod_agent ON public.chat_contacts(cod_agent);
CREATE INDEX idx_chat_contacts_last_message ON public.chat_contacts(last_message_at DESC);

CREATE TRIGGER chat_contacts_set_updated_at
BEFORE UPDATE ON public.chat_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.chat_contacts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  message_id TEXT,
  text TEXT,
  type TEXT DEFAULT 'text',
  from_me BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'sent',
  media_url TEXT,
  file_name TEXT,
  caption TEXT,
  reply_to TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages all authenticated" ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_chat_messages_contact ON public.chat_messages(contact_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_message_id ON public.chat_messages(message_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_contacts REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- ============================================================
-- 3) CRM FOUNDATION (boards + pipelines + deals + custom fields + automations)
-- ============================================================
CREATE TABLE public.crm_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_agent TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layout-dashboard',
  color TEXT DEFAULT '#3b82f6',
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_boards TO authenticated;
GRANT ALL ON public.crm_boards TO service_role;
ALTER TABLE public.crm_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_boards all authenticated" ON public.crm_boards FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.crm_boards(id) ON DELETE CASCADE,
  cod_agent TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  win_probability INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines TO authenticated;
GRANT ALL ON public.crm_pipelines TO service_role;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_pipelines all authenticated" ON public.crm_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.crm_boards(id) ON DELETE CASCADE,
  cod_agent TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','won','lost','archived')),
  position INTEGER NOT NULL DEFAULT 0,
  expected_close_date DATE,
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  assigned_to TEXT,
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_deals TO authenticated;
GRANT ALL ON public.crm_deals TO service_role;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_deals all authenticated" ON public.crm_deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.crm_deal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created','moved','updated','note_added','won','lost')),
  from_pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  to_pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changes JSONB DEFAULT '{}',
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_deal_history TO authenticated;
GRANT ALL ON public.crm_deal_history TO service_role;
ALTER TABLE public.crm_deal_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_deal_history all authenticated" ON public.crm_deal_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.crm_boards(id) ON DELETE CASCADE,
  cod_agent TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB DEFAULT '[]'::jsonb,
  default_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_field_name_per_board UNIQUE (board_id, field_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_custom_fields TO authenticated;
GRANT ALL ON public.crm_custom_fields TO service_role;
ALTER TABLE public.crm_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_custom_fields all authenticated" ON public.crm_custom_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_crm_boards_cod_agent ON public.crm_boards(cod_agent);
CREATE INDEX idx_crm_pipelines_board ON public.crm_pipelines(board_id);
CREATE INDEX idx_crm_deals_pipeline ON public.crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_board ON public.crm_deals(board_id);
CREATE INDEX idx_crm_deals_cod_agent ON public.crm_deals(cod_agent);
CREATE INDEX idx_crm_deals_status ON public.crm_deals(status);
CREATE INDEX idx_crm_deal_history_deal ON public.crm_deal_history(deal_id);
CREATE INDEX idx_crm_custom_fields_board ON public.crm_custom_fields(board_id);

CREATE TRIGGER crm_boards_set_updated_at BEFORE UPDATE ON public.crm_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crm_pipelines_set_updated_at BEFORE UPDATE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crm_deals_set_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crm_custom_fields_set_updated_at BEFORE UPDATE ON public.crm_custom_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_pipelines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_custom_fields;
