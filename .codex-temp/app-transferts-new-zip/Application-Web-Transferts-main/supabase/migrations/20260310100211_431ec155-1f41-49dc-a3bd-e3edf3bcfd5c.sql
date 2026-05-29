-- Add supplier account status and contract status to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contract_status text NOT NULL DEFAULT 'none';

-- Create a trigger to validate allowed values
CREATE OR REPLACE FUNCTION public.validate_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.account_status NOT IN ('pending', 'approved', 'rejected', 'active') THEN
    RAISE EXCEPTION 'Invalid account_status: %', NEW.account_status;
  END IF;
  IF NEW.contract_status NOT IN ('none', 'sent', 'signed', 'validated') THEN
    RAISE EXCEPTION 'Invalid contract_status: %', NEW.contract_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_status_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_status();
