-- =====================================================
-- MIGRATION SCRIPT: DUAL-COMPANY SUPPORT
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR COLUMNAS A PROFILES (si no existen)
DO $$ 
BEGIN
    -- Agregar entity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='entity'
    ) THEN
        ALTER TABLE profiles ADD COLUMN entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
    END IF;

    -- Agregar role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user';
    END IF;

    -- Agregar avatar_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. AGREGAR COLUMNAS A SALES_STATUS
DO $$ 
BEGIN
    -- Agregar user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='sales_status' AND column_name='user_id'
    ) THEN
        ALTER TABLE sales_status ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Agregar entity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='sales_status' AND column_name='entity'
    ) THEN
        ALTER TABLE sales_status ADD COLUMN entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
    END IF;

    -- Agregar client_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='sales_status' AND column_name='client_name'
    ) THEN
        ALTER TABLE sales_status ADD COLUMN client_name TEXT;
    END IF;
END $$;

-- 3. AGREGAR COLUMNAS A MONITORING_STATUS
DO $$ 
BEGIN
    -- Agregar entity (si no existe)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='monitoring_status' AND column_name='entity'
    ) THEN
        ALTER TABLE monitoring_status ADD COLUMN entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
    END IF;
END $$;

-- 4. AGREGAR COLUMNAS A WALL_MESSAGES
DO $$ 
BEGIN
    -- Agregar entity (si no existe)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='wall_messages' AND column_name='entity'
    ) THEN
        ALTER TABLE wall_messages ADD COLUMN entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium';
    END IF;
END $$;

-- 5. AGREGAR COLUMNA A PROJECTS (opcional - si quieres proyectos específicos por empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='projects' AND column_name='entity'
    ) THEN
        ALTER TABLE projects ADD COLUMN entity TEXT CHECK (entity IN ('crowdium', 'cfa', 'shared')) DEFAULT 'shared';
    END IF;
END $$;

-- 6. POPULAR DATOS DE PRUEBA (OPCIONAL - Para demostración)
-- Esto asigna entidades a usuarios existentes de forma aleatoria

-- Asignar entidades aleatorias a perfiles existentes
UPDATE profiles 
SET entity = CASE 
    WHEN random() > 0.5 THEN 'crowdium' 
    ELSE 'cfa' 
END
WHERE entity IS NULL;

-- Asignar role admin al primer usuario (ajusta el email según tu usuario)
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users LIMIT 1);

-- Asignar entidades a ventas basándose en el usuario
UPDATE sales_status s
SET 
    entity = p.entity,
    user_id = p.id
FROM profiles p
WHERE s.user_id IS NULL
LIMIT 1;

-- Asignar entidades a monitoring_status basándose en sender_id
UPDATE monitoring_status m
SET entity = COALESCE(p.entity, 'crowdium')
FROM profiles p
WHERE m.sender_id = p.id;

-- Asignar entidades a wall_messages basándose en sender_id
UPDATE wall_messages w
SET entity = COALESCE(p.entity, 'crowdium')
FROM profiles p
WHERE w.sender_id = p.id;

-- 7. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_status_entity ON sales_status(entity);
CREATE INDEX IF NOT EXISTS idx_sales_status_user_id ON sales_status(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_status_entity ON monitoring_status(entity);
CREATE INDEX IF NOT EXISTS idx_wall_messages_entity ON wall_messages(entity);
CREATE INDEX IF NOT EXISTS idx_profiles_entity ON profiles(entity);

-- =====================================================
-- VERIFICACIÓN: Ejecuta esto después para confirmar
-- =====================================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('profiles', 'sales_status', 'monitoring_status', 'wall_messages', 'projects')
    AND column_name IN ('entity', 'role', 'avatar_url', 'user_id', 'client_name')
ORDER BY table_name, column_name;

-- Ver distribución de entidades
SELECT 'profiles' as table_name, entity, COUNT(*) as count FROM profiles GROUP BY entity
UNION ALL
SELECT 'sales_status', entity, COUNT(*) FROM sales_status GROUP BY entity
UNION ALL
SELECT 'monitoring_status', entity, COUNT(*) FROM monitoring_status GROUP BY entity
UNION ALL
SELECT 'wall_messages', entity, COUNT(*) FROM wall_messages GROUP BY entity;
