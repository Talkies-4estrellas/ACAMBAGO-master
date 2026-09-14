-- ============================================================
-- AcambaGo - Stripe Connect por negocio
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Cada negocio tiene su propia cuenta conectada de Stripe (Express). El
-- dinero de un pedido pagado con tarjeta se transfiere directo a esa cuenta
-- (destination charge), no a una cuenta central de la plataforma.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_account_id      TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 'stripe' faltaba en la restricción de métodos de pago permitidos.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'transfer', 'cod', 'mercadopago', 'stripe'));
