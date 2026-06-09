-- Adicionar novos valores ao enum app_role
-- Nota: Em Postgres, não podemos remover valores de um enum facilmente, então apenas adicionamos.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'superadmin') THEN
    ALTER TYPE public.app_role ADD VALUE 'superadmin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'time') THEN
    ALTER TYPE public.app_role ADD VALUE 'time';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'colaborador') THEN
    ALTER TYPE public.app_role ADD VALUE 'colaborador';
  END IF;
END $$;
