-- ============================================================
-- AcambaGo - Función para crear pedidos de forma atómica
-- Ejecuta este SQL en el SQL Editor de Supabase (después de orders-schema.sql)
--
-- Por qué existe: antes, el checkout hacía dos inserts sueltos
-- (orders y luego order_items). Si el segundo fallaba (por ejemplo,
-- un producto demo con id no-UUID), el pedido quedaba guardado sin
-- productos y sin ningún error visible. Además, la notificación en
-- vivo del vendedor podía dispararse antes de que el segundo insert
-- terminara, mostrando un pedido sin productos.
--
-- Con esta función, ambos inserts ocurren en una sola transacción:
-- o se guarda todo (pedido + productos) o no se guarda nada, y
-- Supabase Realtime solo notifica una vez que ya está todo completo.
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
