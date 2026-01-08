-- 1. Permitir role 'superadmin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'financeiro', 'visualizacao'));

-- 2. Função segura para checar superadmin
CREATE OR REPLACE FUNCTION is_superadmin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Políticas de "Bypass" para Superadmin (Permissive)
-- O Supabase combina políticas com OR por padrão se forem declaradas como PERMISSIVE (default).
-- Então basta adicionar uma policy que retorna TRUE se for superadmin.

CREATE POLICY "Superadmin Full Access Companies" ON companies FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Users" ON users FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Units" ON units FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Suppliers" ON suppliers FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Categories" ON expense_categories FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Payables" ON accounts_payable FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Notes" ON notes FOR ALL USING (is_superadmin());
CREATE POLICY "Superadmin Full Access Audit" ON audit_logs FOR ALL USING (is_superadmin());
