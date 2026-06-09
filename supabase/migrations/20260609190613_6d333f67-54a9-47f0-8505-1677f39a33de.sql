-- Create plans table
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_modules junction table
CREATE TABLE public.plan_modules (
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (plan_id, module_id)
);

-- Add plan_id to clients
ALTER TABLE public.clients ADD COLUMN plan_id UUID REFERENCES public.plans(id);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_modules TO authenticated;
GRANT ALL ON public.plan_modules TO service_role;

-- Policies for plans
CREATE POLICY "Users can view active plans" ON public.plans
    FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage plans" ON public.plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.profiles p ON ur.user_id = p.id
            WHERE p.id = auth.uid() AND ur.role = 'superadmin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.profiles p ON ur.user_id = p.id
            WHERE p.id = auth.uid() AND ur.role = 'superadmin'
        )
    );

-- Policies for plan_modules
CREATE POLICY "Users can view plan modules" ON public.plan_modules
    FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage plan modules" ON public.plan_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.profiles p ON ur.user_id = p.id
            WHERE p.id = auth.uid() AND ur.role = 'superadmin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.profiles p ON ur.user_id = p.id
            WHERE p.id = auth.uid() AND ur.role = 'superadmin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();