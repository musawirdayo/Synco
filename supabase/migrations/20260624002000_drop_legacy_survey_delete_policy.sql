-- The restored remote project had this older delete policy name from a migration
-- that was not in the repo. The repo migration creates "lead delete responses",
-- so drop the duplicate legacy policy to keep fresh and restored schemas aligned.
DROP POLICY IF EXISTS "lead manage survey responses" ON public.survey_responses;
