-- Complete database schema with all tables and functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  gym_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  plan_duration INTEGER NOT NULL,
  joining_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT,
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  plan_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff members table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Branches policies
CREATE POLICY "Users can view own branches" ON branches FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create own branches" ON branches FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own branches" ON branches FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own branches" ON branches FOR DELETE USING (auth.uid() = owner_id);

-- Members policies
CREATE POLICY "Users can view own members" ON members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create members" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own members" ON members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own members" ON members FOR DELETE USING (auth.uid() = user_id);

-- Plans policies
CREATE POLICY "Users can view own plans" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON plans FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff policies
CREATE POLICY "Users can view staff" ON staff_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage staff" ON staff_members FOR ALL USING (auth.uid() = user_id);

-- Database functions that bypass schema cache
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
  SET owner_name = p_owner_name,
      gym_name = p_gym_name,
      email = p_email,
      phone = p_phone
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
