
-- Extend queue_providers with multi-type fields
ALTER TABLE public.queue_providers
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS instance_name text,
  ADD COLUMN IF NOT EXISTS waba_id text,
  ADD COLUMN IF NOT EXISTS phone_number_id text,
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS app_secret text,
  ADD COLUMN IF NOT EXISTS verify_token text,
  ADD COLUMN IF NOT EXISTS ig_business_id text,
  ADD COLUMN IF NOT EXISTS page_id text,
  ADD COLUMN IF NOT EXISTS widget_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS allowed_origins text[];

CREATE INDEX IF NOT EXISTS queue_providers_client_active_idx ON public.queue_providers(client_id, is_active);
CREATE INDEX IF NOT EXISTS queue_providers_type_idx ON public.queue_providers(provider_type);

-- Ensure RLS + grants on queue_providers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_providers TO authenticated;
GRANT ALL ON public.queue_providers TO service_role;
ALTER TABLE public.queue_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_superadmin_all" ON public.queue_providers;
CREATE POLICY "providers_superadmin_all" ON public.queue_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "providers_client_scope" ON public.queue_providers;
CREATE POLICY "providers_client_scope" ON public.queue_providers
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT p.client_id::text FROM public.profiles p WHERE p.id = auth.uid() AND p.client_id IS NOT NULL
    )
  );

-- Extend queues
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.queue_providers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS queues_provider_idx ON public.queues(provider_id);
CREATE INDEX IF NOT EXISTS queues_client_active_idx ON public.queues(client_id, is_active);

-- Seed modules for permissions UI
INSERT INTO public.modules (code, name, category, description, is_active)
VALUES
  ('providers', 'Provedores', 'sistema', 'Gerenciamento de provedores de canais (UazAPI, Evolution, WABA, Instagram, Webchat)', true),
  ('queues', 'Filas', 'sistema', 'Gerenciamento de filas de atendimento vinculadas a provedores', true)
ON CONFLICT (code) DO NOTHING;
