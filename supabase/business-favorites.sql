-- ============================================================
-- AcambaGo - Favoritos de tienda
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Un comprador puede marcar una tienda como favorita (corazón), igual que ya
-- puede hacerlo con productos individuales (product_favorites). RLS
-- deshabilitado a propósito, igual que el resto de las tablas (el proyecto
-- usa Clerk, no Supabase Auth).
CREATE TABLE IF NOT EXISTS public.business_favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, business_id)
);

ALTER TABLE public.business_favorites DISABLE ROW LEVEL SECURITY;
