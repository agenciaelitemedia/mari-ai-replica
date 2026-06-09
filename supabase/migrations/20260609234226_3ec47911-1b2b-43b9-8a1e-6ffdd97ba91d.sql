
ALTER TABLE public.queue_providers ALTER COLUMN client_id DROP NOT NULL;

DROP POLICY IF EXISTS providers_client_scope ON public.queue_providers;
DROP POLICY IF EXISTS providers_superadmin_all ON public.queue_providers;
DROP POLICY IF EXISTS "queue_providers all authenticated" ON public.queue_providers;

CREATE POLICY providers_read_all ON public.queue_providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY providers_superadmin_write ON public.queue_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
