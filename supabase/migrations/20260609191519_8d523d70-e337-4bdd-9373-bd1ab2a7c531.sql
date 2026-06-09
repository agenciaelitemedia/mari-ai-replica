-- Add frequency-based pricing columns
ALTER TABLE public.plans 
ADD COLUMN price_quarterly NUMERIC DEFAULT 0,
ADD COLUMN price_semiannual NUMERIC DEFAULT 0,
ADD COLUMN price_annual NUMERIC DEFAULT 0;

-- Rename existing price column for clarity (optional, but keeping compatibility)
-- Commenting out rename to avoid breaking existing queries, just adding comments
COMMENT ON COLUMN public.plans.price IS 'Monthly price';
COMMENT ON COLUMN public.plans.price_quarterly IS 'Quarterly price';
COMMENT ON COLUMN public.plans.price_semiannual IS 'Semiannual price';
COMMENT ON COLUMN public.plans.price_annual IS 'Annual price';