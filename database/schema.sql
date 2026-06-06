CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STUDENT')),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_products (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  unidad_medida TEXT NOT NULL,
  unidad_medida_codigo TEXT NOT NULL,
  tipo_existencia TEXT NOT NULL,
  stock_minimo REAL NOT NULL,
  stock_maximo REAL NOT NULL,
  observaciones TEXT,
  initial_stock REAL,
  initial_cost REAL,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS system_movements (
  id TEXT PRIMARY KEY,
  activo_id TEXT,
  tipo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  serie TEXT NOT NULL,
  numero TEXT NOT NULL,
  fecha TEXT NOT NULL,
  cantidad REAL NOT NULL,
  costo_unitario REAL NOT NULL,
  tipo_operacion TEXT NOT NULL,
  observaciones TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS system_company_config (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  ruc TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  configurada BOOLEAN DEFAULT FALSE,
  updated_at BIGINT
);

INSERT INTO system_users (id, username, password, full_name, role, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin',
  'khipu-kardex-2026',
  'Administrador de Sistema',
  'ADMIN',
  1717200000000
) ON CONFLICT (username) DO NOTHING;