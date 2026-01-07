-- ============================================
-- RLS POLICIES - WRITE PERMISSIONS FIX
-- ============================================
-- PROBLEMA: Los usuarios autenticados no pueden UPDATE/INSERT
-- SOLUCIÓN: Agregar policies para operaciones de escritura
--
-- Ejecuta este script en: Supabase Dashboard → SQL Editor

-- ============================================
-- 1. SALES_STATUS - Permitir UPDATE/INSERT para usuarios autenticados
-- ============================================

-- Permitir UPDATE (cambiar estado, archivar)
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales_status;
CREATE POLICY "Authenticated users can update sales" 
ON sales_status 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Permitir INSERT (crear nuevas ventas)
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales_status;
CREATE POLICY "Authenticated users can insert sales" 
ON sales_status 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Permitir DELETE (por si acaso, aunque usamos soft delete)
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales_status;
CREATE POLICY "Authenticated users can delete sales" 
ON sales_status 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 2. SALES_STATUS_OPTIONS - Permitir gestión de estados
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage status options" ON sales_status_options;
CREATE POLICY "Authenticated users can manage status options" 
ON sales_status_options 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 3. MONITORING_STATUS - Permitir UPDATE/INSERT
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage monitoring" ON monitoring_status;
CREATE POLICY "Authenticated users can manage monitoring" 
ON monitoring_status 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 4. WALL_MESSAGES - Permitir crear/editar mensajes
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage messages" ON wall_messages;
CREATE POLICY "Authenticated users can manage messages" 
ON wall_messages 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 5. PROJECTS - Permitir gestión de proyectos
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
CREATE POLICY "Authenticated users can manage projects" 
ON projects 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 6. USER_ATTENDANCE - Permitir gestión de asistencia
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON user_attendance;
CREATE POLICY "Authenticated users can manage attendance" 
ON user_attendance 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta este query para verificar las policies:

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Deberías ver policies para:
-- sales_status: 
--   - "Allow public read access" (SELECT)
--   - "Authenticated users can update sales" (UPDATE)
--   - "Authenticated users can insert sales" (INSERT)
--   - "Authenticated users can delete sales" (DELETE)
--
-- Todas las demás tablas deberían tener:
--   - "Allow public read access" (SELECT)
--   - "Authenticated users can manage [table]" (ALL)
