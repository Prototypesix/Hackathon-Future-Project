
-- 1. Lock down SECURITY DEFINER functions: revoke from public/anon/authenticated.
-- Triggers still work (run as table owner / postgres). Policies use has_role/current_company
-- via RLS which is evaluated by postgres role, so revoking client EXECUTE is safe.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_company() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_workflow_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Notifications: restrict INSERT so users can only notify themselves or same-company users.
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
CREATE POLICY "Insert notifications same company"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = notifications.user_id
        AND p.company_id = public.current_company()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. user_roles: explicit INSERT policy restricted to admins (defense-in-depth on top of ALL policy).
DROP POLICY IF EXISTS "Only admins insert roles" ON public.user_roles;
CREATE POLICY "Only admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Companies: restrict creation to users who don't yet belong to a company (onboarding).
DROP POLICY IF EXISTS "Authenticated can create companies" ON public.companies;
CREATE POLICY "Onboarding can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.current_company() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Asset categories: restrict create to managers/admins (not every authenticated user).
DROP POLICY IF EXISTS "Auth create categories" ON public.asset_categories;
CREATE POLICY "Managers create categories"
  ON public.asset_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

-- 6. Storage: add UPDATE/DELETE policies for asset-photos bucket.
CREATE POLICY "Update company asset photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'asset-photos'
    AND ((storage.foldername(name))[1] = (public.current_company())::text OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Delete company asset photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'asset-photos'
    AND ((storage.foldername(name))[1] = (public.current_company())::text OR public.has_role(auth.uid(), 'admin'::app_role))
  );
