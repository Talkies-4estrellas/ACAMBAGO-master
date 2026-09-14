-- ============================================================
-- AcambaGo - Esquema de Base de Datos
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  role       TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'business', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver cualquier perfil" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLA: businesses
-- ============================================================
CREATE TABLE public.businesses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL,
  address      TEXT NOT NULL,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  whatsapp     TEXT,
  image_url    TEXT,
  banner_url   TEXT,
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_approved  BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Negocios aprobados son públicos" ON public.businesses
  FOR SELECT USING (is_approved = true OR auth.uid() = owner_id);

CREATE POLICY "Dueño puede actualizar su negocio" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Usuarios autenticados pueden crear negocios" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLA: products
-- ============================================================
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url   TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productos son públicos" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Dueño puede gestionar productos" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLA: coupons
-- ============================================================
CREATE TABLE public.coupons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value         NUMERIC(10,2) NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  qr_data       TEXT NOT NULL,
  limit_count   INTEGER DEFAULT NULL,
  used_count    INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cupones activos son públicos" ON public.coupons
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Dueño puede gestionar cupones" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLA: coupon_redemptions
-- ============================================================
CREATE TABLE public.coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dueño puede ver redenciones de su negocio" ON public.coupon_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Sistema puede insertar redenciones" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- TABLA: reviews
-- ============================================================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reseñas son públicas" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden dejar reseñas" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su reseña" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su reseña" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIÓN: actualizar rating promedio
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

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Imágenes de negocios son públicas" ON storage.objects
  FOR SELECT USING (bucket_id IN ('business-images', 'product-images'));

CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id IN ('business-images', 'product-images')
  );

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_products_business ON public.products(business_id);
CREATE INDEX idx_coupons_business ON public.coupons(business_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_reviews_business ON public.reviews(business_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions(coupon_id);
