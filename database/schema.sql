-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS (Links to Supabase Auth)
-- Note: You should have a trigger to sync auth.users to public.users if desired, 
-- or just use this table for application references. 
-- For strict RLS, we often query auth.users directly or using a helper function.
-- Here we'll map extra data.
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('admin', 'financeiro', 'visualizacao', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UNITS
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EXPENSE CATEGORIES
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    document TEXT, -- CPF/CNPJ
    bank TEXT,
    notes TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ACCOUNTS PAYABLE
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    unit_id UUID REFERENCES units(id),
    category_id UUID REFERENCES expense_categories(id),
    
    document_number TEXT,
    issue_date DATE,
    due_date DATE NOT NULL,
    payment_date DATE,
    dda BOOLEAN DEFAULT FALSE,
    
    amount NUMERIC(15, 2) NOT NULL,
    barcode_or_pix TEXT,
    bank TEXT,
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- 7. NOTES (Polymorphic)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('supplier', 'unit', 'account')),
    entity_id UUID NOT NULL,
    content TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS HELPERS
-- Function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ENABLE RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT
    USING (id = get_current_company_id());

-- Users: Users can view users in their own company
CREATE POLICY "Users can view co-workers" ON users
    FOR SELECT
    USING (company_id = get_current_company_id());

-- Units
CREATE POLICY "Tenant isolation for units" ON units
    USING (company_id = get_current_company_id());

-- Suppliers
CREATE POLICY "Tenant isolation for suppliers" ON suppliers
    USING (company_id = get_current_company_id());

-- Expense Categories
CREATE POLICY "Tenant isolation for categories" ON expense_categories
    USING (company_id = get_current_company_id());

-- Accounts Payable
CREATE POLICY "Tenant isolation for accounts" ON accounts_payable
    USING (company_id = get_current_company_id());

-- Notes
CREATE POLICY "Tenant isolation for notes" ON notes
    USING (company_id = get_current_company_id());

-- Audit Logs
CREATE POLICY "Tenant isolation for audit" ON audit_logs
    FOR SELECT
    USING (company_id = get_current_company_id());

-- Only allow insert if company_id matches (generic check)
-- For inserts, we often trust the backend or set the company_id automatically via trigger
-- But for frontend direct access, we must ensure they can't insert for another company.

-- TRIGGER TO AUTO-SET COMPANY_ID (Optional but recommended for safety)
CREATE OR REPLACE FUNCTION set_company_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.company_id := get_current_company_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_company_id_units
BEFORE INSERT ON units FOR EACH ROW EXECUTE FUNCTION set_company_id();

CREATE TRIGGER trg_set_company_id_suppliers
BEFORE INSERT ON suppliers FOR EACH ROW EXECUTE FUNCTION set_company_id();

CREATE TRIGGER trg_set_company_id_categories
BEFORE INSERT ON expense_categories FOR EACH ROW EXECUTE FUNCTION set_company_id();

CREATE TRIGGER trg_set_company_id_accounts
BEFORE INSERT ON accounts_payable FOR EACH ROW EXECUTE FUNCTION set_company_id();

-- Specific Rule: Não permitir exclusão de contas pagas (somente estorno)
-- We'll handle this with a BEFORE DELETE trigger
CREATE OR REPLACE FUNCTION prevent_paid_account_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_date IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido excluir contas pagas. Realize um estorno.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_paid
BEFORE DELETE ON accounts_payable
FOR EACH ROW EXECUTE FUNCTION prevent_paid_account_deletion();
