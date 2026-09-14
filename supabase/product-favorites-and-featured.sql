-- ============================================================
-- AcambaGo - Favoritos de producto + Productos Destacados reales
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Un comprador puede marcar un producto como favorito (corazón). RLS
-- deshabilitado a propósito, igual que el resto de las tablas (el proyecto
-- usa Clerk, no Supabase Auth).
CREATE TABLE IF NOT EXISTS public.product_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.product_favorites DISABLE ROW LEVEL SECURITY;

-- "Productos Destacados" en la home ya no es una lista inventada: se basa en
-- ventas reales (order_items). Sin ventas todavía, cae de forma natural a los
-- productos reales más nuevos (COALESCE deja total_sold en 0 para todos, y el
-- segundo criterio de orden hace el resto), nunca a datos simulados.
CREATE OR REPLACE FUNCTION public.get_featured_products(p_limit INT DEFAULT 15)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  price             NUMERIC,
  image_url         TEXT,
  business_id       UUID,
  business_name     TEXT,
  business_category TEXT,
  total_sold        BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.name, p.price, p.image_url,
    p.business_id, b.name AS business_name, b.category AS business_category,
    COALESCE(SUM(oi.quantity), 0) AS total_sold
  FROM public.products p
  JOIN public.businesses b ON b.id = p.business_id
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  WHERE p.is_available = true AND b.is_approved = true AND b.is_active = true
  GROUP BY p.id, p.name, p.price, p.image_url, p.business_id, b.name, b.category
  ORDER BY total_sold DESC, p.created_at DESC
  LIMIT p_limit;
$$;
