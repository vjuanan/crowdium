-- MASTER SETUP - CROWDIUM
-- Por favor, BORRA TODO lo que tengas en el SQL Editor antes de pegar esto.

-- 1. Tabla de Perfiles (si no existe)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium',
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla para Proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla para Mensajes del Muro
CREATE TABLE IF NOT EXISTS wall_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id),
    sender_username TEXT NOT NULL,
    message TEXT NOT NULL,
    tagged_username TEXT,
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    parent_id UUID REFERENCES wall_messages(id) ON DELETE CASCADE
);

-- 4. Tabla para Estado de Ventas
CREATE TABLE IF NOT EXISTS sales_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES auth.users(id),
    entity TEXT CHECK (entity IN ('crowdium', 'cfa')) DEFAULT 'crowdium',
    client_name TEXT,
    series TEXT,
    asset TEXT,
    gross_amount NUMERIC,
    net_amount NUMERIC,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.1 Tabla de Opciones de Estados (NUEVO)
CREATE TABLE IF NOT EXISTS sales_status_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Tabla de Historial de Estados (NUEVO)
CREATE TABLE IF NOT EXISTS sales_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_status(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Trigger para registrar historial (NUEVO)
CREATE OR REPLACE FUNCTION log_sales_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO sales_status_history (sale_id, old_status, new_status)
        VALUES (NEW.id, NULL, NEW.status);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            INSERT INTO sales_status_history (sale_id, old_status, new_status)
            VALUES (NEW.id, OLD.status, NEW.status);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_sales_status_change ON sales_status;
CREATE TRIGGER trg_log_sales_status_change
AFTER INSERT OR UPDATE ON sales_status
FOR EACH ROW EXECUTE FUNCTION log_sales_status_change();

-- 4.1 Tabla de Opciones de Estados (REINICIADA PARA UX NUEVO)
DROP TABLE IF EXISTS sales_status_options CASCADE;
CREATE TABLE IF NOT EXISTS sales_status_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT UNIQUE NOT NULL,
    color_type INT DEFAULT 1, -- 1: Amarillo, 2: Azul, 3: Celeste, 4: Naranja, 5: Rosa, 6: Verde
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía pero no el campo (fix para error de caché)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales_status_options' AND column_name='color_type') THEN
        ALTER TABLE sales_status_options ADD COLUMN color_type INT DEFAULT 1;
    END IF;
END $$;

-- 4.4 Insertar Estados Iniciales (Más limpios)
INSERT INTO sales_status_options (label, color_type, display_order) VALUES
('Reserva recibida, realizando Encuesta Vinculante', 1, 1),
('Operación concretada, a la espera del detalle de Gastos de CFA', 2, 2),
('Encuesta Vinculante realizada, Preparando Distribución internamente', 3, 3),
('Distribución Lista, Preparando Mailing para Reinversores', 4, 4),
('Distribución enviada a CFA para pagar a inversores o reinvertir', 5, 5),
('Distribución realizada y acreditada en Plataforma', 6, 6)
ON CONFLICT (label) DO NOTHING;

-- 5. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_status_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_status_history ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Seguridad (Borrar si existen y recrear)

-- ... (Existing policies)

-- Sales Status History (Public Read)
DROP POLICY IF EXISTS "Public read sales_status_history" ON sales_status_history;
CREATE POLICY "Public read sales_status_history" ON sales_status_history FOR SELECT TO anon, authenticated USING (true);

-- Sales Status Options (Public Read / Auth Write)
DROP POLICY IF EXISTS "Public read sales_status_options" ON sales_status_options;
CREATE POLICY "Public read sales_status_options" ON sales_status_options FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Auth manage sales_status_options" ON sales_status_options;
CREATE POLICY "Auth manage sales_status_options" ON sales_status_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Monitoring Status (Create if missing & Public Read)
CREATE TABLE IF NOT EXISTS monitoring_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    theme TEXT NOT NULL,
    status TEXT NOT NULL,
    update_text TEXT,
    sender_id UUID REFERENCES auth.users(id),
    sender_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE monitoring_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read monitoring" ON monitoring_status;
CREATE POLICY "Public read monitoring" ON monitoring_status FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Auth insert monitoring" ON monitoring_status;
CREATE POLICY "Auth insert monitoring" ON monitoring_status FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Auth manage monitoring" ON monitoring_status;
CREATE POLICY "Auth manage monitoring" ON monitoring_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-applying Sales Status policies for clarity
DROP POLICY IF EXISTS "Public read sales_status" ON sales_status;
CREATE POLICY "Public read sales_status" ON sales_status FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow auth all sales_status" ON sales_status;
CREATE POLICY "Allow auth all sales_status" ON sales_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Wall Messages Policies (Public Read / Auth Manage)
DROP POLICY IF EXISTS "Public read wall" ON wall_messages;
CREATE POLICY "Public read wall" ON wall_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Auth insert wall" ON wall_messages;
CREATE POLICY "Auth insert wall" ON wall_messages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Auth manage wall" ON wall_messages;
CREATE POLICY "Auth manage wall" ON wall_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Projects Policies (Public Read / Auth Manage)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Auth manage projects" ON projects;
CREATE POLICY "Auth manage projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
