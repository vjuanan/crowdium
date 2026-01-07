-- ============================================
-- REPARACIÓN CRÍTICA: RLS POLICIES
-- ============================================
-- Ejecuta este archivo en Supabase Dashboard → SQL Editor
-- Esto permitirá que la app lea datos sin autenticación

-- 1. Monitoring Status - Permitir lectura pública
ALTER TABLE monitoring_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON monitoring_status;
CREATE POLICY "Allow public read access" ON monitoring_status
FOR SELECT USING (true);

-- 2. Sales Status - Permitir lectura pública
ALTER TABLE sales_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON sales_status;
CREATE POLICY "Allow public read access" ON sales_status
FOR SELECT USING (true);

-- 3. Sales Status Options - Permitir lectura pública
ALTER TABLE sales_status_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON sales_status_options;
CREATE POLICY "Allow public read access" ON sales_status_options
FOR SELECT USING (true);

-- 4. Projects - Permitir lectura pública
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON projects;
CREATE POLICY "Allow public read access" ON projects
FOR SELECT USING (true);

-- 5. Wall Messages - Permitir lectura pública
ALTER TABLE wall_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON wall_messages;
CREATE POLICY "Allow public read access" ON wall_messages
FOR SELECT USING (true);

-- 6. Profiles - Permitir lectura pública
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON profiles;
CREATE POLICY "Allow public read access" ON profiles
FOR SELECT USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar este script:
-- 1. Ve a Authentication → Policies en Supabase
-- 2. Verifica que cada tabla tenga la policy "Allow public read access"
-- 3. Recarga tu aplicación
