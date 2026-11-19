-- Row-level security helpers used by the policies in 0001_schema.sql.
--
-- They are SECURITY DEFINER so a policy can check membership without
-- re-entering home_members' own RLS (which would recurse). plpgsql bodies are
-- not validated at creation time, so these can be created before the tables.
-- search_path is pinned to stop a caller from shadowing the tables.

CREATE OR REPLACE FUNCTION public.is_home_member(p_home_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.home_members m
    WHERE m.home_id = p_home_id AND m.user_id = auth.uid()
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.can_edit_home(p_home_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.home_members m
    WHERE m.home_id = p_home_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'editor')
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_home_owner(p_home_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.homes h
    WHERE h.id = p_home_id AND h.owner_id = auth.uid()
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.module_home_id(p_module_id uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT m.home_id FROM public.modules m WHERE m.id = p_module_id);
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.task_home_id(p_task_id uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT m.home_id FROM public.tasks t
    JOIN public.modules m ON m.id = t.module_id
    WHERE t.id = p_task_id
  );
END;
$$;
--> statement-breakpoint
-- Only signed-in users need these; keep them away from anon.
REVOKE EXECUTE ON FUNCTION
  public.is_home_member(uuid), public.can_edit_home(uuid), public.is_home_owner(uuid),
  public.module_home_id(uuid), public.task_home_id(uuid)
FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION
  public.is_home_member(uuid), public.can_edit_home(uuid), public.is_home_owner(uuid),
  public.module_home_id(uuid), public.task_home_id(uuid)
TO authenticated, service_role;
