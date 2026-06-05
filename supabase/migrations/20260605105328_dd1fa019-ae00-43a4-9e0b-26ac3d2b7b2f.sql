
-- fault-evidence bucket policies (path: <company_id>/<...>)
CREATE POLICY "Read company fault evidence" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fault-evidence'
  AND (
    (storage.foldername(name))[1] = public.current_company()::text
    OR public.has_role(auth.uid(),'admin')
  )
);
CREATE POLICY "Upload company fault evidence" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fault-evidence'
  AND (storage.foldername(name))[1] = public.current_company()::text
);
CREATE POLICY "Delete company fault evidence" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'fault-evidence'
  AND (
    (storage.foldername(name))[1] = public.current_company()::text
    OR public.has_role(auth.uid(),'admin')
  )
);

-- asset-photos bucket policies
CREATE POLICY "Read company asset photos" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'asset-photos'
  AND (
    (storage.foldername(name))[1] = public.current_company()::text
    OR public.has_role(auth.uid(),'admin')
  )
);
CREATE POLICY "Upload company asset photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'asset-photos'
  AND (storage.foldername(name))[1] = public.current_company()::text
);
