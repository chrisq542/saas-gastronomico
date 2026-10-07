-- ==========================================================
-- SAAS FAST-FOOD - MIGRACIÓN BASE SUPABASE / POSTGRESQL
-- Incluye: Tablas, Índices, Triggers (Máx 3 direcciones),
-- RLS y Publicación en Supabase Realtime
-- ==========================================================

-- 1. ENUMS
CREATE TYPE order_type_enum AS ENUM ('DELIVERY', 'PICKUP', 'DINE_IN');
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CARD_ON_DELIVERY', 'TRANSFER', 'ONLINE');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- 2. CLIENTES (CUSTOMERS)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    rut VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices de búsqueda rápida por teléfono y RUT
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_rut ON customers(rut);

-- 3. DIRECCIONES (ADDRESSES - MÁXIMO 3 POR CLIENTE)
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(50) NOT NULL,
    apartment VARCHAR(50),
    city VARCHAR(100) DEFAULT 'Santiago' NOT NULL,
    reference VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);

-- Trigger para garantizar un máximo de 3 direcciones por cliente
CREATE OR REPLACE FUNCTION check_max_addresses_per_customer()
RETURNS TRIGGER AS $$
DECLARE
    address_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO address_count
    FROM addresses
    WHERE customer_id = NEW.customer_id;

    IF address_count >= 3 THEN
        RAISE EXCEPTION 'El cliente ya tiene el límite máximo de 3 direcciones registradas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_addresses
BEFORE INSERT ON addresses
FOR EACH ROW
EXECUTE FUNCTION check_max_addresses_per_customer();

-- 4. CATEGORÍAS (CATEGORIES)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_categories_active_order ON categories(is_active, sort_order);

-- 5. PRODUCTOS (PRODUCTS)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    preparation_time INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);

-- 6. PEDIDOS (ORDERS)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    order_type order_type_enum DEFAULT 'DELIVERY' NOT NULL,
    status order_status_enum DEFAULT 'PENDING' NOT NULL,
    payment_method payment_method_enum DEFAULT 'CASH' NOT NULL,
    payment_status payment_status_enum DEFAULT 'PENDING' NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    kitchen_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 7. ITEMS DEL PEDIDO (ORDER_ITEMS)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 8. SUPABASE REALTIME CONFIGURATION
-- Habilitar replicación para que el Kitchen Display System (KDS) reciba updates instantáneos
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas públicas: Menú legible para todos
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (is_available = true);

-- Inserción de pedidos y clientes públicos (Checkout sin login)
CREATE POLICY "Public Insert Customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Customers by phone" ON customers FOR SELECT USING (true);
CREATE POLICY "Public Insert Addresses" ON addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Order Items" ON order_items FOR INSERT WITH CHECK (true);

-- Acceso completo a administradores autenticados
CREATE POLICY "Admin Full Access Categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Addresses" ON addresses FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Order Items" ON order_items FOR ALL TO authenticated USING (true);
