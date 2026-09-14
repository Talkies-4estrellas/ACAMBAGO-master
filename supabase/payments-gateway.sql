-- ============================================================
-- AcambaGo - Soporte para pagos reales con pasarela (Mercado Pago primero)
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- El pedido puede pagarse con una pasarela externa; agregamos ese método
-- y separamos "estado de entrega" (status) de "estado de pago" (payment_status),
-- porque son cosas independientes: un pedido puede ir en camino aunque el
-- pago siga pendiente de confirmar, o viceversa.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'transfer', 'cod', 'mercadopago'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendiente'
  CHECK (payment_status IN ('pendiente', 'pagado', 'fallido'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- La función create_order_with_items no necesita cambiar de firma: los
-- pedidos por pasarela se crean igual (payment_method = 'mercadopago',
-- payment_status queda en 'pendiente' por default) y el webhook de Mercado
-- Pago es quien actualiza payment_status/mp_payment_id cuando confirma el cobro.
