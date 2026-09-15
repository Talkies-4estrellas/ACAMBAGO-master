-- ============================================================
-- AcambaGo - Categorías propias por producto
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Antes la única categoría vivía en businesses.category, así que todo
-- producto heredaba la única categoría de su tienda (una tienda de ropa no
-- podía tener un producto de "Accesorios"). Este arreglo permite que un
-- producto tenga una o varias categorías propias, independientes de la de
-- su tienda. Se respalda desde la categoría actual del negocio para que
-- ningún producto existente quede sin categoría.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.products p
SET categories = ARRAY[b.category]
FROM public.businesses b
WHERE b.id = p.business_id AND p.categories = '{}';

-- Para que .contains()/.overlaps() sobre categories (arreglo) sea rápido.
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING GIN (categories);

-- get_featured_products ("Más vendidos") necesita devolver las categorías
-- propias del producto para poder filtrar por categoría ahí también. De
-- paso se incluyen stock_quantity/is_available por si featured-products-
-- stock.sql todavía no se había corrido en este entorno (misma firma final,
-- sin importar cuál de las dos migraciones se corrió primero).
--
-- Postgres no deja cambiar las columnas de retorno de una función con
-- CREATE OR REPLACE si ya existe con otra forma (error 42P13) — hay que
-- borrarla primero. DROP ... IF EXISTS la deja lista para correr este
-- archivo más de una vez sin error.
DROP FUNCTION IF EXISTS public.get_featured_products(INT);

CREATE OR REPLACE FUNCTION public.get_featured_products(p_limit INT DEFAULT 15)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  price             NUMERIC,
  image_url         TEXT,
  business_id       UUID,
  business_name     TEXT,
  business_category TEXT,
  categories        TEXT[],
  total_sold        BIGINT,
  stock_quantity    INTEGER,
  is_available      BOOLEAN
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.name, p.price, p.image_url,
    p.business_id, b.name AS business_name, b.category AS business_category,
    p.categories,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    p.stock_quantity, p.is_available
  FROM public.products p
  JOIN public.businesses b ON b.id = p.business_id
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  WHERE p.is_available = true AND b.is_approved = true AND b.is_active = true
  GROUP BY p.id, p.name, p.price, p.image_url, p.business_id, b.name, b.category, p.categories, p.stock_quantity, p.is_available
  ORDER BY total_sold DESC, p.created_at DESC
  LIMIT p_limit;
$$;
