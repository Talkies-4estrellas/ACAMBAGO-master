-- Un producto se guarda siempre, aunque le falten datos: si no tiene al
-- menos 1 foto, precio y categoría, se guarda como borrador (is_draft =
-- true) en vez de bloquear el guardado. Un borrador es visible y editable
-- solo para el vendedor en "Mis Productos" — nunca para el público, hasta
-- que se complete y se vuelva a guardar. Cantidad NO es parte de este
-- mínimo: dejarla vacía sigue siendo la forma de decir "no llevo control
-- de inventario para este producto", no un dato incompleto.
--
-- Sin backfill a propósito: no se marcan como borrador productos ya
-- existentes que hoy están publicados aunque les falte algo — eso ocultaría
-- inventario real de tiendas ya activas sin que nadie lo pidiera. La regla
-- nueva solo aplica hacia adelante, la próxima vez que ese producto se guarde.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

-- get_featured_products ("Productos Destacados" / "Más vendidos") también
-- debe dejar fuera los borradores — mismo motivo que ya filtra is_available.
-- No cambian las columnas de RETURNS TABLE, así que no hace falta el
-- DROP FUNCTION que sí necesitó product-categories.sql.
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
  WHERE p.is_available = true AND p.is_draft = false AND b.is_approved = true AND b.is_active = true
  GROUP BY p.id, p.name, p.price, p.image_url, p.business_id, b.name, b.category, p.categories, p.stock_quantity, p.is_available
  ORDER BY total_sold DESC, p.created_at DESC
  LIMIT p_limit;
$$;
