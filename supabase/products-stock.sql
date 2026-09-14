-- ============================================================
-- AcambaGo - Inventario real (cantidad en stock)
-- Ejecuta este SQL en el SQL Editor de Supabase (despues de orders-rpc.sql)
-- ============================================================

-- NULL = el vendedor no lleva control de cantidad (se sigue usando solo
-- products.is_available como hasta ahora, cero cambio de comportamiento).
-- Con un numero, "agotado" y "ultimas unidades" se calculan solos.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

-- Se reemplaza create_order_with_items (mismo nombre y firma, compatible
-- con el codigo actual) para que, de paso, descuente stock cuando el
-- producto SI lleva cantidad controlada. Si stock_quantity es NULL para
-- un producto, este UPDATE no le hace nada (se excluye con el WHERE).
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

  UPDATE public.products p
  SET stock_quantity = GREATEST(p.stock_quantity - (item->>'quantity')::INTEGER, 0)
  FROM jsonb_array_elements(p_items) AS item
  WHERE p.id = (item->>'product_id')::UUID
    AND p.stock_quantity IS NOT NULL;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items TO anon, authenticated;
