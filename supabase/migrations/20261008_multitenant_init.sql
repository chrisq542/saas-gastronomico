-- =============================================================================
-- SAAS GASTRONÓMICO B2B - MIGRACIÓN BASE MULTI-TENANT
-- Archivo: 20261008_multitenant_init.sql
-- Compatible con: Supabase SQL Editor / PostgreSQL 15+
-- =============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'STORE_ADMIN', 'KITCHEN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_type') THEN
        CREATE TYPE delivery_type AS ENUM ('DELIVERY', 'PICKUP', 'DINE_IN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('CASH', 'CARD_ON_DELIVERY', 'TRANSFER', 'ONLINE');
    END IF;
END $$;

-- 3. TABLA RESTAURANTES (TENANTS / LOCALES)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);

-- 4. TABLA USUARIOS (SUPERADMIN, STORE_ADMIN, KITCHEN)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'STORE_ADMIN' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. TABLA CATEGORÍAS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(restaurant_id, sort_order);

-- 6. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(restaurant_id, is_active);

-- 7. TABLA CLIENTES (COMENSALES AISLADOS POR RESTAURANTE)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    rut VARCHAR(20),
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_customer_restaurant_phone UNIQUE (restaurant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_rut ON customers(rut);

-- 8. TABLA DIRECCIONES (MÁXIMO 3 POR CLIENTE)
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL,
    reference VARCHAR(255),
    commune VARCHAR(100) DEFAULT 'Santiago' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);

-- Trigger PL/pgSQL: Garantizar máximo 3 direcciones por cliente
CREATE OR REPLACE FUNCTION check_max_addresses_per_customer()
RETURNS TRIGGER AS $$
DECLARE
    address_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO address_count
    FROM addresses
    WHERE customer_id = NEW.customer_id;

    IF address_count >= 3 THEN
        RAISE EXCEPTION 'Límite alcanzado: El cliente no puede registrar más de 3 direcciones.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_max_addresses ON addresses;
CREATE TRIGGER trigger_check_max_addresses
BEFORE INSERT ON addresses
FOR EACH ROW
EXECUTE FUNCTION check_max_addresses_per_customer();

-- 9. TABLA PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_number SERIAL,
    status order_status DEFAULT 'PENDING' NOT NULL,
    delivery_type delivery_type DEFAULT 'DELIVERY' NOT NULL,
    payment_method payment_method DEFAULT 'CASH' NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(restaurant_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(restaurant_id, created_at);

-- 10. TABLA ITEMS DE PEDIDO (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1 NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 11. HABILITACIÓN DE SUPABASE REALTIME (MONITOR KDS DE COCINA)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;

-- 12. SEED DE PRUEBA INICIAL (DATOS MULTI-TENANT BASE)
-- A) Restaurante Demo
INSERT INTO restaurants (id, slug, name, phone, is_active)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'sas-burger',
    'SAS Burger Demo',
    '56912345678',
    TRUE
)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, phone = EXCLUDED.phone;

-- B) Usuario SUPERADMIN Global (Sin restaurant_id)
-- Password demo: Password123! (hash bcrypt de prueba)
INSERT INTO users (id, restaurant_id, email, password_hash, role)
VALUES (
    'b1111111-1111-1111-1111-111111111111',
    NULL,
    'admin@saasgastronomico.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'SUPERADMIN'
)
ON CONFLICT (email) DO UPDATE SET role = 'SUPERADMIN';

-- C) Usuarios para el Restaurante 'sas-burger'
INSERT INTO users (id, restaurant_id, email, password_hash, role)
VALUES 
(
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'gerente@sasburger.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'STORE_ADMIN'
),
(
    'b3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'cocina@sasburger.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'KITCHEN'
)
ON CONFLICT (email) DO NOTHING;

-- D) Categorías Base para 'sas-burger'
INSERT INTO categories (id, restaurant_id, name, sort_order)
VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Hamburguesas Smash',
    1
),
(
    'c2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Papas & Acompañamientos',
    2
),
(
    'c3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Bebidas & Refrescos',
    3
)
ON CONFLICT (id) DO NOTHING;

-- E) Productos Base para 'sas-burger'
INSERT INTO products (id, restaurant_id, category_id, name, description, price, image_url, is_active)
VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Doble Bacon Cheese Smash',
    'Doble medallón 100g de carne angus smash, queso cheddar fundido, tocino crocante y salsa de la casa.',
    8990.00,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    TRUE
),
(
    'd2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Triple Oklahoma Onion Burger',
    'Tres medallones smash con cebolla caramelizada incrustada en la plancha, triple cheddar y pepinillos.',
    10490.00,
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    TRUE
),
(
    'd3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'Papas Rústicas Cheddar & Bacon',
    'Papas corte rústico cubiertas con salsa de queso cheddar fundido y tocino crujiente.',
    4990.00,
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    TRUE
),
(
    'd4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333333',
    'Bebida Lata 350ml (Coca-Cola / Zero / Sprite)',
    'Lata helada a elección del cliente.',
    1800.00,
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    TRUE
)
ON CONFLICT (id) DO NOTHING;
