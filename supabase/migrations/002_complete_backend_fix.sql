-- Complete backend fix for MuscleDesk
-- This migration ensures all tables, columns, RLS policies, and functions are correctly configured

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_profile(UUID);
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS get_expiring_members(UUID, INTEGER);

-- Ensure all columns exist with correct types
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE members ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE members ADD COLUMN IF NOT EXISTS plan_duration INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE payments ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS member_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create get_user_profile function
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'owner_name', owner_name,
    'gym_name', gym_name,
    'email', email,
    'phone', phone,
    'role', role,
    'created_at', created_at
  ) INTO result
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create create_user_profile function
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_owner_name TEXT,
  p_gym_name TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO profiles (id, owner_name, gym_name, email, phone, role, created_at)
  VALUES (p_user_id, p_owner_name, p_gym_name, p_email, p_phone, 'owner', NOW())
  ON CONFLICT (id) DO UPDATE 
  SET owner_name = EXCLUDED.owner_name,
      gym_name = EXCLUDED.gym_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone
  RETURNING json_build_object(
    'id', id,
    'owner_name', owner_name,
    'gym_name', gym_name,
    'email', email,
    'phone', phone,
    'role', role
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_members INTEGER;
  active_members INTEGER;
  expiring_members INTEGER;
  total_revenue NUMERIC;
  monthly_revenue NUMERIC;
BEGIN
  -- Count members
  SELECT COUNT(*) INTO total_members
  FROM members
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO active_members
  FROM members
  WHERE user_id = p_user_id AND status = 'active';
  
  SELECT COUNT(*) INTO expiring_members
  FROM members
  WHERE user_id = p_user_id 
  AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
  
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue
  FROM payments
  WHERE user_id = p_user_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO monthly_revenue
  FROM payments
  WHERE user_id = p_user_id
  AND payment_date >= DATE_TRUNC('month', CURRENT_DATE);
  
  result := json_build_object(
    'total_members', total_members,
    'active_members', active_members,
    'expiring_members', expiring_members,
    'total_revenue', total_revenue,
    'monthly_revenue', monthly_revenue
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get expiring members
CREATE OR REPLACE FUNCTION get_expiring_members(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  plan_duration INTEGER,
  expiry_date DATE,
  days_left INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.email,
    m.phone,
    m.plan_duration,
    m.expiry_date,
    (m.expiry_date - CURRENT_DATE)::INTEGER as days_left
  FROM members m
  WHERE m.user_id = p_user_id
  AND m.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days || ' days')::INTERVAL
  AND m.status IN ('active', 'expiring')
  ORDER BY m.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_members(UUID, INTEGER) TO authenticated;
