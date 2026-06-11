-- Allow class leads (instructors) to delete survey responses within their classes
DROP POLICY IF EXISTS "lead delete responses" ON public.survey_responses;

CREATE POLICY "lead delete responses" ON public.survey_responses
FOR DELETE
TO authenticated
USING (public.is_class_lead(class_id, auth.uid()));
