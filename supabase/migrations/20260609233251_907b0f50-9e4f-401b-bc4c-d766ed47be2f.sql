-- Alinhar queue_providers com schema do appjulia
ALTER TABLE public.queue_providers
  ADD COLUMN IF NOT EXISTS meta_app_id text,
  ADD COLUMN IF NOT EXISTS meta_app_secret text,
  ADD COLUMN IF NOT EXISTS waba_business_id text,
  ADD COLUMN IF NOT EXISTS waba_token text,
  ADD COLUMN IF NOT EXISTS instagram_page_id text,
  ADD COLUMN IF NOT EXISTS instagram_user_id text,
  ADD COLUMN IF NOT EXISTS page_access_token text,
  ADD COLUMN IF NOT EXISTS page_name text,
  ADD COLUMN IF NOT EXISTS webchat_config_id uuid;

-- Backfill WABA
UPDATE public.queue_providers
SET waba_business_id = COALESCE(waba_business_id, waba_id),
    waba_token = COALESCE(waba_token, access_token)
WHERE provider_type = 'waba';

-- Backfill Instagram
UPDATE public.queue_providers
SET instagram_user_id = COALESCE(instagram_user_id, ig_business_id),
    instagram_page_id = COALESCE(instagram_page_id, page_id),
    page_access_token = COALESCE(page_access_token, access_token)
WHERE provider_type = 'instagram';