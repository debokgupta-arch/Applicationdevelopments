-- v2 data mapping: move v1 data into the v2 shape without losing anything.
-- Runs after 0004 (new columns/tables exist) and before 0006 (old columns
-- dropped, new NOT NULLs applied). Safe to re-run on already-mapped rows.

-- 1. Tasks: v1 nesting allowed task > sub-task > sub-sub-task; v2 has exactly
--    two levels, so third-level rows move up to sit directly under their task.
UPDATE public.tasks AS t
SET parent_task_id = p.parent_task_id
FROM public.tasks AS p
WHERE t.parent_task_id = p.id AND p.parent_task_id IS NOT NULL;
--> statement-breakpoint
-- 2. Tasks: copy renamed fields and derive the level.
UPDATE public.tasks SET
  planned_end   = COALESCE(planned_end, due_date),
  expected_cost = COALESCE(expected_cost, cost_estimate),
  actual_cost   = COALESCE(actual_cost, cost_actual),
  level         = CASE WHEN parent_task_id IS NULL THEN 'task'::task_level ELSE 'subtask'::task_level END;
--> statement-breakpoint
-- 3. Floors: every existing home gets a "Ground" floor holding its existing rooms.
INSERT INTO public.floors (home_id, label, sort_order)
SELECT h.id, 'Ground', 0
FROM public.homes AS h
WHERE NOT EXISTS (SELECT 1 FROM public.floors AS f WHERE f.home_id = h.id);
--> statement-breakpoint
UPDATE public.rooms AS r
SET floor_id = (
  SELECT f.id FROM public.floors AS f
  WHERE f.home_id = r.home_id
  ORDER BY f.sort_order, f.created_at
  LIMIT 1
)
WHERE r.floor_id IS NULL;
--> statement-breakpoint
-- 4. Homes: address becomes mandatory. Existing homes without one get an empty
--    string; the app asks the owner to fill it in (Settings > Home).
UPDATE public.homes SET address = '' WHERE address IS NULL;
--> statement-breakpoint
-- 5. Settings: one row per home with the documented defaults.
INSERT INTO public.app_settings (home_id, currency)
SELECT h.id, h.currency FROM public.homes AS h
ON CONFLICT (home_id) DO NOTHING;
--> statement-breakpoint
-- 6. Profiles: copy the sign-in email, then derive a unique user name from it
--    (letters, digits, '.', '_'; 3-30 chars; numeric suffix on clashes).
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE u.id = p.user_id AND p.email IS NULL AND u.email IS NOT NULL;
--> statement-breakpoint
WITH raw AS (
  SELECT
    p.id,
    COALESCE(
      NULLIF(regexp_replace(lower(split_part(COALESCE(p.email::text, p.display_name), '@', 1)), '[^a-z0-9._]', '', 'g'), ''),
      'user'
    ) AS cleaned
  FROM public.profiles AS p
  WHERE p.username IS NULL
),
base AS (
  -- Pad short names to 3 chars (rpad alone would also truncate long ones), cap at 24.
  SELECT r.id, left(rpad(r.cleaned, greatest(3, length(r.cleaned)), '0'), 24) AS stem
  FROM raw AS r
),
numbered AS (
  SELECT
    b.id,
    b.stem,
    row_number() OVER (PARTITION BY b.stem ORDER BY b.id) AS n
  FROM base AS b
)
UPDATE public.profiles AS p
SET username = CASE
  WHEN numbered.n = 1 AND NOT EXISTS (
    SELECT 1 FROM public.profiles AS q WHERE q.username = numbered.stem::citext
  ) THEN numbered.stem
  ELSE numbered.stem || '_' || numbered.n::text || substr(md5(p.id::text), 1, 4)
END
FROM numbered
WHERE numbered.id = p.id;
--> statement-breakpoint
-- 7. updated_at triggers for the new tables (same function as 0002).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'app_settings', 'floors', 'task_contacts', 'task_selections', 'payments',
    'space_progress', 'line_items', 'line_item_materials', 'stages'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t || '_set_updated_at', t
    );
  END LOOP;
END;
$$;
