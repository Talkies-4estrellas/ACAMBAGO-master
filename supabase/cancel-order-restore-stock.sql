-- ============================================================
-- AcambaGo - Cancelar un pedido regresa el stock que se descontó
-- Ejecuta este SQL en el SQL Editor de Supabase (después de products-stock.sql)
-- ============================================================

-- El stock ya se descuenta al momento de hacer el pedido (create_order_with_items
-- en products-stock.sql), no hasta que se marca como entregado — eso se queda
-- igual, para no vender de más mientras un pedido está pendiente o en camino.
--
-- Pero cancelar un pedido nunca regresaba ese stock: una unidad comprada y
-- luego cancelada se quedaba "perdida" del inventario para siempre. Esta
-- función junta cancelar + regresar el stock en un solo paso atómico, para
-- que tanto el vendedor (dashboard/business/orders) como el comprador
-- (checkout/tracking) la llamen en vez de actualizar el status directo.
CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_stock(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Idempotente: si ya estaba cancelado (doble clic, dos pestañas abiertas,
  -- etc.), no se vuelve a regresar el stock una segunda vez.
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND status != 'cancelado') THEN
    RETURN;
  END IF;

  UPDATE public.products p
  SET stock_quantity = p.stock_quantity + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id
    AND p.stock_quantity IS NOT NULL;

  UPDATE public.orders SET status = 'cancelado', updated_at = NOW() WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order_and_restore_stock TO anon, authenticated;
