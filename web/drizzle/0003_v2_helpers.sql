-- v2 prerequisites for 0004_v2_additive.
-- citext gives case-insensitive unique user names and emails (available on Supabase).
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
-- RLS helper: home of a line item (via its task). plpgsql so it can be created
-- before line_items exists; SECURITY DEFINER to avoid recursive RLS checks.
CREATE OR REPLACE FUNCTION public.line_item_home_id(p_line_item_id uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT public.task_home_id(li.task_id) FROM public.line_items li WHERE li.id = p_line_item_id
  );
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.line_item_home_id(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.line_item_home_id(uuid) TO authenticated, service_role;
