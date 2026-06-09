ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.plans.settings IS 'Configurações flexíveis do plano (ex: {"queues_count": 1})';