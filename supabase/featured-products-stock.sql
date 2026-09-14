-- ============================================================
-- AcambaGo - Stock visible en "Productos Destacados" / Categorias / Mas vendidos
-- Ejecuta este SQL en el SQL Editor de Supabase (despues de products-stock.sql)
-- ============================================================

-- get_featured_products (creada en product-favorites-and-featured.sql) no
-- devolvia stock_quantity ni is_available, asi que las tarjetas del home,
-- /categorias y /mas-vendidos no podian mostrar "Agotado"/"Ultimas X" como
-- ya hace la ficha de producto. Se agregan ambas columnas sin tocar el
-- resto de la firma ni el orden (compatible con el codigo actual).
CREATE OR REPLACE FUNCTION public.get_featured_products(p_limit INT DEFAULT 15)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  price             NUMERIC,
  image_url         TEXT,
  business_id       UUID,
  business_name     TEXT,
  business_category TEXT,
  total_sold        BIGINT,
  stock_quantity    INTEGER,
  is_available      BOOLEAN
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.name, p.price, p.image_url,
    p.business_id, b.name AS business_name, b.category AS business_category,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    p.stock_quantity, p.is_available
  FROM public.products p
  JOIN public.businesses b ON b.id = p.business_id
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  WHERE p.is_available = true AND b.is_approved = true AND b.is_active = true
  GROUP BY p.id, p.name, p.price, p.image_url, p.business_id, b.name, b.category, p.stock_quantity, p.is_available
  ORDER BY total_sold DESC, p.created_at DESC
  LIMIT p_limit;
$$;
