-- PostgreSQL Schema for RIS Portal (Supabase)

-- ==========================================
-- CUSTOM TYPES
-- ==========================================
CREATE TYPE enum_users_role AS ENUM ('superadmin', 'admin', 'admin_administrative', 'employee');
CREATE TYPE enum_ris_forms_status AS ENUM ('draft', 'sent', 'received', 'ris_no_assigned');
CREATE TYPE enum_reports_report_type AS ENUM ('monthly', 'quarterly', 'semestral', 'yearly');

-- ==========================================
-- TABLES
-- ==========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  role enum_users_role DEFAULT 'employee',
  department VARCHAR(100) DEFAULT NULL,
  division VARCHAR(100) DEFAULT NULL,
  office VARCHAR(100) DEFAULT NULL,
  designation VARCHAR(100) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  stock_no VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  category_prefix VARCHAR(2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  quantity INTEGER DEFAULT 0,
  image_url VARCHAR(500) DEFAULT NULL,
  is_available BOOLEAN DEFAULT false,
  created_by INTEGER DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE ris_forms (
  id SERIAL PRIMARY KEY,
  ris_no VARCHAR(50) DEFAULT NULL,
  entity_name VARCHAR(200) DEFAULT NULL,
  fund_cluster VARCHAR(100) DEFAULT NULL,
  division VARCHAR(100) DEFAULT NULL,
  office VARCHAR(100) DEFAULT NULL,
  responsibility_center_code VARCHAR(100) DEFAULT NULL,
  purpose TEXT DEFAULT NULL,
  status enum_ris_forms_status DEFAULT 'draft',
  employee_id INTEGER DEFAULT NULL,
  admin_department VARCHAR(100) DEFAULT NULL,
  requested_by_name VARCHAR(150) DEFAULT NULL,
  requested_by_designation VARCHAR(100) DEFAULT NULL,
  requested_by_date DATE DEFAULT NULL,
  approved_by_name VARCHAR(150) DEFAULT NULL,
  approved_by_designation VARCHAR(100) DEFAULT NULL,
  approved_by_date DATE DEFAULT NULL,
  issued_by_name VARCHAR(150) DEFAULT NULL,
  issued_by_designation VARCHAR(100) DEFAULT NULL,
  issued_by_date DATE DEFAULT NULL,
  received_by_name VARCHAR(150) DEFAULT NULL,
  received_by_designation VARCHAR(100) DEFAULT NULL,
  received_by_date DATE DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE ris_items (
  id SERIAL PRIMARY KEY,
  ris_id INTEGER NOT NULL,
  stock_no VARCHAR(20) DEFAULT NULL,
  unit VARCHAR(30) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  quantity_requisition INTEGER DEFAULT 0,
  stock_available_yes BOOLEAN DEFAULT false,
  stock_available_no BOOLEAN DEFAULT false,
  quantity_issue INTEGER DEFAULT 0,
  remarks VARCHAR(255) DEFAULT NULL,
  row_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  report_type enum_reports_report_type NOT NULL,
  period_label VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  generated_by INTEGER DEFAULT NULL,
  is_auto BOOLEAN DEFAULT false,
  report_data TEXT DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ==========================================
-- RELATIONSHIPS (FOREIGN KEYS)
-- ==========================================

ALTER TABLE inventory_items
  ADD CONSTRAINT fk_inventory_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE ris_forms
  ADD CONSTRAINT fk_ris_employee_id 
  FOREIGN KEY (employee_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE ris_items
  ADD CONSTRAINT fk_ris_items_ris_id 
  FOREIGN KEY (ris_id) REFERENCES ris_forms(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
/* 
  NOTE: The Node.js backend uses Sequelize with a direct connection string, 
  which bypasses RLS by default. However, if you plan to use the Supabase 
  Data API directly from the frontend in the future, you can enable these policies.
*/

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_items ENABLE ROW LEVEL SECURITY;

-- 1. Users Policy
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- 2. RIS Forms Policies
CREATE POLICY "Employees can view and edit their own RIS" ON ris_forms
  FOR ALL USING (employee_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Admins can view RIS in their department" ON ris_forms
  FOR SELECT USING (
    status != 'draft' AND 
    admin_department = (SELECT department FROM users WHERE id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  );

CREATE POLICY "Superadmins can view all RIS" ON ris_forms
  FOR ALL USING (
    (SELECT role FROM users WHERE id::text = current_setting('request.jwt.claims', true)::json->>'sub') = 'superadmin'
  );

-- 3. RIS Items Policies
CREATE POLICY "Users can view and edit items of their RIS" ON ris_items
  FOR ALL USING (
    ris_id IN (SELECT id FROM ris_forms WHERE employee_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- ==========================================
-- AUTO-DELETION (CRON JOB)
-- ==========================================
/*
  To prevent the database from filling up, this cron job automatically 
  deletes RIS forms that are older than 48 hours. 
  Because of the ON DELETE CASCADE relationship, all associated RIS items 
  will also be automatically deleted.
*/

-- Enable the pg_cron extension (requires Supabase project admin rights)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a job to run every hour (at minute 0) to delete old RIS forms
SELECT cron.schedule(
  'auto-delete-old-ris-forms', -- Job name
  '0 * * * *',                 -- Cron schedule: Every hour
  $$ DELETE FROM ris_forms WHERE "createdAt" < NOW() - INTERVAL '48 hours'; $$
);
