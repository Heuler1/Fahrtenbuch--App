-- Existing rows are preserved, including legacy rows without a vehicle.
-- New writes must reference a vehicle owned by the authenticated user.
-- Restrictive policies are ANDed with the existing owner policies.
BEGIN;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['trips', 'fuel_entries', 'maintenance_entries', 'reminders'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS vehicle_owner_guard ON public.%I', target);
    EXECUTE format(
      'CREATE POLICY vehicle_owner_guard ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (auth.uid() = user_id)
       WITH CHECK (auth.uid() = user_id AND vehicle_id IS NOT NULL AND EXISTS
         (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.user_id = auth.uid()))', target);
  END LOOP;
END $$;
COMMIT;
