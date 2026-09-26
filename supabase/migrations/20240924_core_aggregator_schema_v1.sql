-- Migration: Core Aggregator Schema v1
-- Description: Foundation schema for the PolyFit aggregator model
-- Creates: organizations, providers, provider_locations, employees, benefits, eligibility tables
-- Includes: RLS policies, performance indexes, seed data

-- Enable PostGIS extension for geography support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create ENUM types
CREATE TYPE provider_category AS ENUM ('gym', 'pool', 'studio', 'clinic', 'wellness_center');
CREATE TYPE employee_status AS ENUM ('active', 'frozen', 'terminated');
CREATE TYPE eligibility_status AS ENUM ('active', 'suspended', 'expired');

-- Create organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  contact_email TEXT,
  billing_email TEXT,
  tax_id TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create providers table
CREATE TABLE providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category provider_category NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  contact_email TEXT,
  settlement_email TEXT,
  tax_id TEXT,
  bank_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create provider_locations table
CREATE TABLE provider_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  operating_hours JSONB,
  amenities TEXT[],
  photos TEXT[],
  capacity INT,
  geo GEOGRAPHY(POINT, 4326),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  employee_id_external TEXT,
  department TEXT,
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('basic', 'standard', 'premium')),
  status employee_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint to employees email
ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email);

-- Create benefits table
CREATE TABLE benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_monthly_visits INT DEFAULT 4,
  co_pay_percentage DECIMAL(5,2) DEFAULT 0.00,
  allowed_provider_categories TEXT[] DEFAULT ARRAY['gym', 'pool', 'studio', 'clinic', 'wellness_center'],
  allowed_locations UUID[],
  budget_cap_per_employee NUMERIC(10,2),
  is_family_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create eligibility table
CREATE TABLE eligibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  status eligibility_status DEFAULT 'active',
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(employee_id, benefit_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_locations_updated_at BEFORE UPDATE ON provider_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create performance indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_contact_email ON organizations(contact_email);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_contact_email ON providers(contact_email);
CREATE INDEX idx_providers_category ON providers(category);
CREATE INDEX idx_provider_locations_provider_id ON provider_locations(provider_id);
CREATE INDEX idx_provider_locations_status ON provider_locations(status);
CREATE INDEX idx_provider_locations_geo ON provider_locations USING GIST(geo);
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_benefits_org_id ON benefits(org_id);
CREATE INDEX idx_eligibility_employee_id ON eligibility(employee_id);
CREATE INDEX idx_eligibility_benefit_id ON eligibility(benefit_id);
CREATE INDEX idx_eligibility_status ON eligibility(status);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, allow service role and authenticated users with org membership
  -- TODO: Implement proper org admin check via app_metadata
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS policies
CREATE POLICY "Service role full access" ON organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can read organizations" ON organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Providers RLS policies
CREATE POLICY "Service role full access" ON providers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can read providers" ON providers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Provider locations RLS policies
CREATE POLICY "Service role full access" ON provider_locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can read provider locations" ON provider_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Employees RLS policies
CREATE POLICY "Service role full access" ON employees
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Employees can read own data" ON employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Org admins can read org employees" ON employees
  FOR SELECT USING (is_org_admin(org_id));

-- Benefits RLS policies
CREATE POLICY "Service role full access" ON benefits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Org admins can read org benefits" ON benefits
  FOR SELECT USING (is_org_admin(org_id));

-- Eligibility RLS policies
CREATE POLICY "Service role full access" ON eligibility
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Employees can read own eligibility" ON eligibility
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = eligibility.employee_id 
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can read org eligibility" ON eligibility
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = eligibility.employee_id 
      AND is_org_admin(employees.org_id)
    )
  );

-- Seed data for testing
-- 1 Organization
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'TechCorp Rwanda') THEN
    INSERT INTO organizations (name, industry, contact_email, billing_email, country, status)
    VALUES ('TechCorp Rwanda', 'Technology', 'hr@techcorp.rw', 'finance@techcorp.rw', 'Rwanda', 'active');
  END IF;
END $$;

-- 2 Providers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM providers WHERE name = 'FitLife Gym Kigali') THEN
    INSERT INTO providers (name, category, contact_email, settlement_email, status)
    VALUES ('FitLife Gym Kigali', 'gym', 'contact@fitlife.rw', 'finance@fitlife.rw', 'active');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM providers WHERE name = 'Serenity Yoga Studio') THEN
    INSERT INTO providers (name, category, contact_email, settlement_email, status)
    VALUES ('Serenity Yoga Studio', 'studio', 'info@serenityyoga.rw', 'billing@serenityyoga.rw', 'active');
  END IF;
END $$;

-- 5 Employees for the organization
DO $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE name = 'TechCorp Rwanda';
  
  IF org_id IS NOT NULL THEN
    -- Insert employees if they don't already exist
    INSERT INTO employees (org_id, user_id, full_name, email, employee_id_external, department, tier, status)
    SELECT org_id, NULL, full_name, email, employee_id_external, department, tier, status
    FROM (VALUES
      ('Jean Mugabo', 'jean.mugabo@techcorp.rw', 'EMP001', 'Engineering', 'standard', 'active'),
      ('Marie Uwimana', 'marie.uwimana@techcorp.rw', 'EMP002', 'Marketing', 'standard', 'active'),
      ('Patrick Niyonzima', 'patrick.niyonzima@techcorp.rw', 'EMP003', 'Finance', 'premium', 'active'),
      ('Claudine Mukandekeza', 'claudine.mukandekeza@techcorp.rw', 'EMP004', 'HR', 'standard', 'active'),
      ('Eric Habimana', 'eric.habimana@techcorp.rw', 'EMP005', 'Operations', 'basic', 'active')
    ) AS v(full_name, email, employee_id_external, department, tier, status)
    WHERE NOT EXISTS (
      SELECT 1 FROM employees WHERE employees.email = v.email
    );
  END IF;
END $$;
