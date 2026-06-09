
-- ============================================================
-- MarI.A — Phase 2: Chat/WhatsApp core
-- ============================================================

-- 1) chat_conversations
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.chat_contacts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  cod_agent TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp_uazapi',
  status TEXT NOT NULL DEFAULT 'pending',
  protocol TEXT NOT NULL,
  assigned_to TEXT,
  department TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  tags TEXT[] DEFAULT '{}',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  close_reason TEXT,
  close_note TEXT,
  metadata JSONB DEFAULT '{}',
  queue_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_conversations all authenticated" ON public.chat_conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE SEQUENCE IF NOT EXISTS public.chat_conversation_protocol_seq START WITH 1;

CREATE INDEX idx_chat_conversations_contact_id ON public.chat_conversations(contact_id);
CREATE INDEX idx_chat_conversations_client_id ON public.chat_conversations(client_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_conversations_protocol ON public.chat_conversations(protocol);
CREATE INDEX idx_chat_conversations_cod_agent ON public.chat_conversations(cod_agent);

CREATE OR REPLACE FUNCTION public.generate_conversation_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.protocol IS NULL OR NEW.protocol = '' THEN
    NEW.protocol := '#' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.chat_conversation_protocol_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_conversation_protocol
  BEFORE INSERT ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.generate_conversation_protocol();

CREATE TRIGGER chat_conversations_set_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) chat_conversation_history
CREATE TABLE public.chat_conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_name TEXT,
  from_value TEXT,
  to_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversation_history TO authenticated;
GRANT ALL ON public.chat_conversation_history TO service_role;
ALTER TABLE public.chat_conversation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_conversation_history all authenticated" ON public.chat_conversation_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_chat_conv_history_conversation ON public.chat_conversation_history(conversation_id);

-- 3) chat_tags
CREATE TABLE public.chat_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_tags TO authenticated;
GRANT ALL ON public.chat_tags TO service_role;
ALTER TABLE public.chat_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_tags all authenticated" ON public.chat_tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_chat_tags_client ON public.chat_tags(client_id);

-- 4) chat_conversation_tags
CREATE TABLE public.chat_conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.chat_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversation_tags TO authenticated;
GRANT ALL ON public.chat_conversation_tags TO service_role;
ALTER TABLE public.chat_conversation_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_conversation_tags all authenticated" ON public.chat_conversation_tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5) chat_departments
CREATE TABLE public.chat_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agents TEXT[] DEFAULT '{}',
  client_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_departments TO authenticated;
GRANT ALL ON public.chat_departments TO service_role;
ALTER TABLE public.chat_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_departments all authenticated" ON public.chat_departments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER chat_departments_set_updated_at
  BEFORE UPDATE ON public.chat_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Extend chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_note BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_name TEXT;
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;

-- 7) queues (WhatsApp / UazAPI instances)
CREATE TABLE public.queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'uazapi',
  hub TEXT,
  evo_url TEXT,
  evo_apikey TEXT,
  evo_instance TEXT,
  phone_number TEXT,
  waba_id TEXT,
  waba_token TEXT,
  waba_number_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queues TO authenticated;
GRANT ALL ON public.queues TO service_role;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queues all authenticated" ON public.queues
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_queues_client ON public.queues(client_id) WHERE is_deleted = false;
CREATE TRIGGER queues_set_updated_at
  BEFORE UPDATE ON public.queues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) queue_providers
CREATE TABLE public.queue_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'uazapi',
  name TEXT NOT NULL,
  evo_url TEXT,
  evo_apikey TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_providers TO authenticated;
GRANT ALL ON public.queue_providers TO service_role;
ALTER TABLE public.queue_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_providers all authenticated" ON public.queue_providers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_queue_providers_client ON public.queue_providers(client_id);
CREATE TRIGGER queue_providers_set_updated_at
  BEFORE UPDATE ON public.queue_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) chat_message_reactions (small useful extra)
CREATE TABLE public.chat_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_message_reactions TO authenticated;
GRANT ALL ON public.chat_message_reactions TO service_role;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_message_reactions all authenticated" ON public.chat_message_reactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
