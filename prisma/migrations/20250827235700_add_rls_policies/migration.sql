-- This script applies Row-Level Security (RLS) to all admin-related tables.
-- It uses the `public.is_admin(uuid)` function to check for admin privileges.

-- UserProfiles
ALTER TABLE my_new_schema.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.user_profiles
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- AuditLog
ALTER TABLE my_new_schema.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.audit_logs
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Broadcasts
ALTER TABLE my_new_schema.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.broadcasts
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- FeatureFlags
ALTER TABLE my_new_schema.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.feature_flags
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ApprovalQueue
ALTER TABLE my_new_schema.approval_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.approval_queue
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Sanctions
ALTER TABLE my_new_schema.sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.sanctions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- CreditLedger
ALTER TABLE my_new_schema.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.credit_ledger
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Vendors
ALTER TABLE my_new_schema.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.vendors
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- VendorSignals
ALTER TABLE my_new_schema.vendor_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.vendor_signals
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- VendorVerifications
ALTER TABLE my_new_schema.vendor_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.vendor_verifications
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- VendorSanctions
ALTER TABLE my_new_schema.vendor_sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.vendor_sanctions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- VendorEvents
ALTER TABLE my_new_schema.vendor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_access ON my_new_schema.vendor_events
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
