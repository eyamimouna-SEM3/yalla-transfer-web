
-- Deny all INSERT on user_roles (service role key bypasses RLS)
CREATE POLICY "Prevent user role self-assignment"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Deny all UPDATE on user_roles
CREATE POLICY "Prevent user role modification"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);

-- Deny all DELETE on user_roles
CREATE POLICY "Prevent user role deletion"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);
