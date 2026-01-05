-- =====================================================
-- MIGRATION SCRIPT CORREGIDO: DUAL-COMPANY SUPPORT
-- =====================================================

-- 1. AGREGAR COLUMNAS A PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. AGREGAR COLUMNAS A SALES_STATUS
ALTER TABLE sales_status ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE sales_status ADD COLUMN IF NOT EXISTS entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
ALTER TABLE sales_status ADD COLUMN IF NOT EXISTS client_name TEXT;

-- 3. AGREGAR COLUMNA A MONITORING_STATUS
ALTER TABLE monitoring_status ADD COLUMN IF NOT EXISTS entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';

-- 4. AGREGAR COLUMNA A WALL_MESSAGES
ALTER TABLE wall_messages ADD COLUMN IF NOT EXISTS entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';

-- 5. AGREGAR COLUMNA A PROJECTS
ALTER TABLE projects ADD COLUMN IF NOT EXISTS entity TEXT CHECK (entity IN ('crowdium', 'cfa', 'shared')) DEFAULT 'shared';

-- 6. POPULAR DATOS DE PRUEBA
UPDATE profiles 
SET entity = CASE 
    WHEN random() > 0.5 THEN 'crowdium' 
    ELSE 'cfa' 
END
WHERE entity IS NULL;

UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users LIMIT 1);

-- Asignar entidades a ventas (SIN LIMIT en UPDATE)
UPDATE sales_status s
SET 
    entity = p.entity,
    user_id = p.id
FROM profiles p
WHERE s.user_id IS NULL AND s.id IN (
    SELECT id FROM sales_status WHERE user_id IS NULL LIMIT 1
);

UPDATE monitoring_status m
SET entity = COALESCE(p.entity, 'crowdium')
FROM profiles p
WHERE m.sender_id = p.id;

UPDATE wall_messages w
SET entity = COALESCE(p.entity, 'crowdium')
FROM profiles p
WHERE w.sender_id = p.id;

-- 7. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_sales_status_entity ON sales_status(entity);
CREATE INDEX IF NOT EXISTS idx_sales_status_user_id ON sales_status(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_status_entity ON monitoring_status(entity);
CREATE INDEX IF NOT EXISTS idx_wall_messages_entity ON wall_messages(entity);
CREATE INDEX IF NOT EXISTS idx_profiles_entity ON profiles(entity);
