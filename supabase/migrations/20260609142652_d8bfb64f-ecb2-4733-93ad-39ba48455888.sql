
-- Phase 3: CRM functional - link conversations to deals
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.chat_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_deals_conversation_id ON public.crm_deals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON public.crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline_position ON public.crm_deals(pipeline_id, position);

-- Realtime
ALTER TABLE public.crm_deals REPLICA IDENTITY FULL;
ALTER TABLE public.crm_pipelines REPLICA IDENTITY FULL;
ALTER TABLE public.crm_boards REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='crm_deals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='crm_pipelines') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_pipelines;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='crm_boards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_boards;
  END IF;
END $$;
