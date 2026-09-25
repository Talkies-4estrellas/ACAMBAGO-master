-- ============================================================
-- AcambaGo - El precio de un pedido ya no lo decide el cliente
-- Ejecuta este SQL en el SQL Editor de Supabase
--
-- Hallazgo real: create_order_with_items recibia el precio (y el
-- nombre) de cada producto tal cual los mandaba el cliente
-- (p_items[].price / .name), sin comparar contra products.price.
-- Como la funcion tiene GRANT EXECUTE para "anon" y la llave
-- anonima del proyecto es publica (va en el bundle del navegador),
-- cualquiera podia llamar el RPC directo - sin pasar por el
-- checkout - mandando el precio que quisiera.
--
-- Arreglo: la funcion ahora IGNORA el precio/nombre que manda el
-- cliente y los vuelve a leer de products, cruzando cada
-- product_id contra products.business_id = p_business_id (de paso
-- tampoco se pueden meter productos de otro negocio en el pedido).
-- p_subtotal/p_total que manda el cliente ya no se escriben tal
-- cual, se recalculan aqui a partir del precio real. Tambien se
-- exige cantidad positiva por producto: sin ese chequeo, una
-- cantidad negativa habria seguido dando un total negativo (y
-- ademas sumado stock en vez de restarlo), aunque el precio ya
-- fuera el real.
--
-- Firma y nombre de la funcion sin cambios (create_order_with_items,
-- mismos parametros) - el checkout no necesita ningun cambio.
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
  v_item_count INTEGER;
  v_valid_count INTEGER;
  v_subtotal NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_item_count FROM jsonb_array_elements(p_items);

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene productos';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) AS item
    WHERE (item->>'quantity')::INTEGER <= 0
  ) THEN
    RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a cero';
  END IF;

  -- Precio real de cada producto, tomado de products (nunca del
  -- cliente), y solo si ese producto pertenece al negocio del pedido.
  SELECT COUNT(*), COALESCE(SUM(pr.price * (item->>'quantity')::INTEGER), 0)
  INTO v_valid_count, v_subtotal
  FROM jsonb_array_elements(p_items) AS item
  JOIN public.products pr
    ON pr.id = (item->>'product_id')::UUID
    AND pr.business_id = p_business_id;

  IF v_valid_count <> v_item_count THEN
    RAISE EXCEPTION 'Uno o más productos no son válidos para este pedido';
  END IF;

  INSERT INTO public.orders (
    business_id, user_id, customer_name, customer_phone, status,
    delivery_method, payment_method, address, note, subtotal, shipping_cost, total
  ) VALUES (
    p_business_id, p_user_id, p_customer_name, p_customer_phone, p_status,
    p_delivery_method, p_payment_method, p_address, p_note,
    v_subtotal, p_shipping_cost, v_subtotal + p_shipping_cost
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, name, price, quantity)
  SELECT
    v_order_id,
    pr.id,
    pr.name,
    pr.price,
    (item->>'quantity')::INTEGER
  FROM jsonb_array_elements(p_items) AS item
  JOIN public.products pr ON pr.id = (item->>'product_id')::UUID;

  UPDATE public.products p
  SET stock_quantity = GREATEST(p.stock_quantity - (item->>'quantity')::INTEGER, 0)
  FROM jsonb_array_elements(p_items) AS item
  WHERE p.id = (item->>'product_id')::UUID
    AND p.stock_quantity IS NOT NULL;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items TO anon, authenticated;
