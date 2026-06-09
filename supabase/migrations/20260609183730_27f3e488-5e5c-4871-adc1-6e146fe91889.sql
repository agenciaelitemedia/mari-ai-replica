-- Função para inicializar permissões padrão para um novo usuário baseado em seu papel
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.app_role;
  v_mod_id UUID;
BEGIN
  -- Tenta pegar o papel do usuário na tabela user_roles
  -- Nota: Isso pode falhar se o papel for inserido DEPOIS do perfil. 
  -- Ajustaremos para ser disparado por mudanças em user_roles também.
  
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = NEW.id LIMIT 1;
  
  IF v_role IS NOT NULL THEN
    -- Inserir permissões padrão do papel para o usuário
    INSERT INTO public.user_permissions (user_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT NEW.id, module_id, can_view, can_create, can_edit, can_delete
    FROM public.role_default_permissions
    WHERE role = v_role::text
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para quando um perfil é criado
DROP TRIGGER IF EXISTS on_profile_created_permissions ON public.profiles;
CREATE TRIGGER on_profile_created_permissions
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();

-- Função para lidar com mudança de papel
CREATE OR REPLACE FUNCTION public.handle_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário não tiver permissões customizadas habilitadas, atualizamos as permissões dele
  -- para as permissões padrão do novo papel.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND use_custom_permissions = FALSE) THEN
    -- Remove permissões antigas que não são customizadas
    DELETE FROM public.user_permissions WHERE user_id = NEW.user_id;
    
    -- Insere as novas permissões baseadas no papel
    INSERT INTO public.user_permissions (user_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT NEW.user_id, module_id, can_view, can_create, can_edit, can_delete
    FROM public.role_default_permissions
    WHERE role = NEW.role::text
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para quando o papel do usuário muda
DROP TRIGGER IF EXISTS on_user_role_change_permissions ON public.user_roles;
CREATE TRIGGER on_user_role_change_permissions
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_change();

-- Garantir que maria.jmel.castro@gmail.com é superadmin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'maria.jmel.castro@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Inserir ou atualizar papel para superadmin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin';
    
    -- Garantir que o perfil existe e está ativo
    INSERT INTO public.profiles (id, email, is_active)
    VALUES (v_user_id, 'maria.jmel.castro@gmail.com', TRUE)
    ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  END IF;
END $$;
