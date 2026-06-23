-- The restored remote project had newer RPC definitions but older permissive
-- read/update policies. Reconcile those policies without downgrading functions.

DROP POLICY IF EXISTS "auth can read classes" ON public.classes;
DROP POLICY IF EXISTS "lead or member read classes" ON public.classes;
CREATE POLICY "lead or member read classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  auth.uid() = lead_id
  OR public.is_class_member(id, auth.uid())
);

DROP POLICY IF EXISTS "auth can read roster" ON public.roster_entries;
DROP POLICY IF EXISTS "auth can claim roster" ON public.roster_entries;
DROP POLICY IF EXISTS "lead or member read roster" ON public.roster_entries;
CREATE POLICY "lead or member read roster"
ON public.roster_entries
FOR SELECT
TO authenticated
USING (
  public.is_class_lead(class_id, auth.uid())
  OR public.is_class_member(class_id, auth.uid())
);
