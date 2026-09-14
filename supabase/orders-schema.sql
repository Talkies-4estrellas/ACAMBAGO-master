-- ============================================================
-- AcambaGo - Esquema de pedidos (orders)
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a propósito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql)
-- ============================================================

CREATE TABLE public.orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,
  status         TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_camino', 'entregado', 'cancelado')),
  delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'meeting', 'home')),
  payment_method  TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'cod')),
  address        JSONB,
  note           TEXT,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  price      NUMERIC(10,2) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_orders_user_id     ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Habilita Supabase Realtime para poder notificar al vendedor
-- en cuanto entra un pedido nuevo (INSERT) sin tener que refrescar la página.
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
