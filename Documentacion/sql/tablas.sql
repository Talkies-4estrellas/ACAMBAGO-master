-- ============================================================
-- AcambaGo (marca "Acom-Di") — Esquema final de la base de datos
-- Supabase (PostgreSQL). Proyecto real: fdgcodeimqfwzctrjlds
-- Generado: 2026-07-14
--
-- Este archivo es el ESTADO ACTUAL de las tablas, no la historia de
-- migraciones. Es el resultado de aplicar, en este orden:
--   1. supabase/schema.sql
--   2. supabase/clerk-migration.sql        (IDs UUID -> TEXT de Clerk, RLS OFF)
--   3. supabase/orders-schema.sql
--   4. supabase/orders-rpc.sql
--   5. supabase/products-gallery-and-bank.sql
--   6. supabase/payments-gateway.sql          (payment_status y campos de Mercado Pago en orders)
--   7. supabase/payments-per-business.sql     (mp_public_key / mp_access_token en businesses)
--   8. supabase/stripe-connect.sql            (Stripe Connect por negocio + stripe_payment_intent_id)
--   9. supabase/fix-rls-disabled.sql          (re-aplicar si RLS se reactiva por accidente)
--
-- IMPORTANTE: el proyecto usa Clerk para autenticacion, NO Supabase Auth.
-- Por eso RLS esta DESHABILITADO en todas las tablas: la seguridad se valida
-- en las rutas de la API y en el codigo del servidor, no en Postgres. Si RLS
-- se reactiva (por ejemplo al aceptar una sugerencia del Security Advisor de
-- Supabase), la llave anon deja de poder leer NINGUNA fila sin dar error
-- visible (solo arreglos vacios) -- correr fix-rls-disabled.sql lo corrige.
-- Los IDs de usuario (profiles.id, businesses.owner_id, reviews.user_id,
-- orders.user_id, coupon_redemptions.user_id) son TEXT con formato "user_xxx"
-- de Clerk, no UUID.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles  (perfil de cada usuario de Clerk)
-- ============================================================
CREATE TABLE public.profiles (
  id         TEXT PRIMARY KEY,                 -- ID de Clerk ("user_xxx")
  name       TEXT NOT NULL,
  phone      TEXT,
  role       TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'business', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: businesses  (negocios / tiendas)
-- ============================================================
CREATE TABLE public.businesses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL,
  address      TEXT NOT NULL,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  whatsapp     TEXT,
  image_url    TEXT,
  banner_url   TEXT,
  bank_name    TEXT,                           -- datos bancarios reales (transferencia)
  bank_holder  TEXT,
  bank_clabe   TEXT,
  mp_public_key          TEXT,                  -- Mercado Pago: credenciales PROPIAS de la tienda
  mp_access_token        TEXT,                  --   (el cobro se hace con la cuenta del vendedor)
  stripe_account_id      TEXT,                  -- Stripe Connect: cuenta Express conectada del negocio
  stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false, -- true cuando Stripe ya habilita cobros
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_approved  BOOLEAN DEFAULT false,          -- el admin lo pone en true para publicar
  is_active    BOOLEAN DEFAULT true,           -- suspension por el admin
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: products  (catalogo de cada negocio)
-- ============================================================
CREATE TABLE public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url    TEXT,                           -- portada (primer elemento de image_urls)
  image_urls   TEXT[] NOT NULL DEFAULT '{}',   -- galeria de hasta 6 fotos
  is_available BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: coupons  (cupones con codigo y QR)
-- ============================================================
CREATE TABLE public.coupons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value         NUMERIC(10,2) NOT NULL,
  code          TEXT NOT NULL UNIQUE,          -- formato "ACAM-XXXXXX"
  qr_data       TEXT NOT NULL,                 -- JSON: { coupon_code, business_id }
  limit_count   INTEGER DEFAULT NULL,          -- NULL = ilimitado
  used_count    INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: coupon_redemptions  (registro de canjes)
-- ============================================================
CREATE TABLE public.coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES public.profiles(id),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.coupon_redemptions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: reviews  (resenas, 1 por usuario y negocio)
-- ============================================================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: orders  (pedidos del checkout)
-- ============================================================
CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,                -- ID de Clerk del comprador
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT,
  status          TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente', 'en_camino', 'entregado', 'cancelado')),
  delivery_method TEXT NOT NULL DEFAULT 'pickup'
                    CHECK (delivery_method IN ('pickup', 'meeting', 'home')),
  payment_method  TEXT NOT NULL DEFAULT 'cash'
                    CHECK (payment_method IN ('cash', 'card', 'transfer', 'cod', 'mercadopago', 'stripe')),
  payment_status  TEXT NOT NULL DEFAULT 'pendiente'  -- estado del COBRO, independiente de status (entrega)
                    CHECK (payment_status IN ('pendiente', 'pagado', 'fallido')),
  mp_preference_id         TEXT,                -- Mercado Pago: preferencia de Checkout Pro
  mp_payment_id            TEXT,                --   y id del pago que confirma el webhook
  stripe_payment_intent_id TEXT,               -- Stripe: PaymentIntent del destination charge
  address         JSONB,                        -- direccion completa cuando es envio a domicilio
  note            TEXT,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLA: order_items  (productos de cada pedido)
-- ============================================================
CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,                     -- copia del nombre al momento de la compra
  price      NUMERIC(10,2) NOT NULL,            -- copia del precio al momento de la compra
  quantity   INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCION: create_order_with_items
-- Inserta un pedido y sus productos en UNA sola transaccion.
-- O se guarda todo (pedido + items) o no se guarda nada. La llama
-- el checkout una vez por negocio del carrito.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_business_id     UUID,
  p_user_id         TEXT,
  p_customer_name   TEXT,
  p_customer_phone  TEXT,
  p_status          TEXT,
  p_delivery_method TEXT,
  p_payment_method  TEXT,
  p_address         JSONB,
  p_note            TEXT,
  p_subtotal        NUMERIC,
  p_shipping_cost   NUMERIC,
  p_total           NUMERIC,
  p_items           JSONB
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  INSERT INTO public.orders (
    business_id, user_id, customer_name, customer_phone, status,
    delivery_method, payment_method, address, note, subtotal, shipping_cost, total
  ) VALUES (
    p_business_id, p_user_id, p_customer_name, p_customer_phone, p_status,
    p_delivery_method, p_payment_method, p_address, p_note, p_subtotal, p_shipping_cost, p_total
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, name, price, quantity)
  SELECT
    v_order_id,
    (item->>'product_id')::UUID,
    item->>'name',
    (item->>'price')::NUMERIC,
    (item->>'quantity')::INTEGER
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items TO anon, authenticated;

-- ============================================================
-- FUNCION + TRIGGER: recalcular rating promedio de un negocio
-- cada vez que cambia una resena.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses
  SET
    rating_avg = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    )
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

-- NOTA: el trigger on_auth_user_created / handle_new_user() de la version con
-- Supabase Auth fue ELIMINADO en clerk-migration.sql. Ahora el perfil se crea
-- desde el codigo (onboarding/page.tsx y settings/page.tsx hacen upsert en profiles).

-- ============================================================
-- STORAGE BUCKETS  (publicos)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Imagenes de negocios son publicas" ON storage.objects
  FOR SELECT USING (bucket_id IN ('business-images', 'product-images'));

-- Subida abierta (sin Supabase Auth); la valida el codigo cliente con Clerk.
CREATE POLICY "Subida publica de imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('business-images', 'product-images'));

-- ============================================================
-- REALTIME  (para notificar al vendedor de pedidos nuevos)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- INDICES
-- ============================================================
CREATE INDEX idx_businesses_owner    ON public.businesses(owner_id);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_products_business   ON public.products(business_id);
CREATE INDEX idx_coupons_business    ON public.coupons(business_id);
CREATE INDEX idx_coupons_code        ON public.coupons(code);
CREATE INDEX idx_reviews_business    ON public.reviews(business_id);
CREATE INDEX idx_reviews_user        ON public.reviews(user_id);
CREATE INDEX idx_redemptions_coupon  ON public.coupon_redemptions(coupon_id);
CREATE INDEX idx_orders_business_id  ON public.orders(business_id);
CREATE INDEX idx_orders_user_id      ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
