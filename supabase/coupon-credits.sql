-- ============================================================
-- AcambaGo - Creditos de cupones asignados por el administrador
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql)
--
-- Concepto: "coupon_credits" es un saldo por negocio que el admin le
-- asigna. Cada cupon NUEVO que el vendedor crea en
-- /dashboard/business/coupons/new consume 1 de ese saldo (ver el
-- trigger mas abajo). Si el saldo llega a 0, no puede crear mas hasta
-- que el admin le asigne mas. Editar/renovar un cupon existente NO
-- consume saldo, solo crear uno nuevo.
-- ============================================================

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS coupon_credits INTEGER NOT NULL DEFAULT 0;

-- Historial de cada asignacion: que tienda, cuantos cupones, que admin
-- (id de Clerk) y cuando. Nunca se borra ni se edita, solo se inserta.
CREATE TABLE IF NOT EXISTS public.coupon_credit_grants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  admin_user_id TEXT NOT NULL,
  amount        INTEGER NOT NULL CHECK (amount > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_credit_grants_business_id ON public.coupon_credit_grants(business_id);

ALTER TABLE public.coupon_credit_grants DISABLE ROW LEVEL SECURITY;

-- Asigna cupones a un negocio de forma atomica: suma al saldo actual
-- (no lo reemplaza) y deja registro en el historial, en una sola
-- transaccion. Regresa el saldo total despues de sumar.
CREATE OR REPLACE FUNCTION public.grant_coupon_credits(
  p_business_id UUID,
  p_admin_user_id TEXT,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'La cantidad de cupones debe ser mayor a cero';
  END IF;

  UPDATE public.businesses
  SET coupon_credits = coupon_credits + p_amount
  WHERE id = p_business_id
  RETURNING coupon_credits INTO v_new_total;

  IF v_new_total IS NULL THEN
    RAISE EXCEPTION 'Negocio no encontrado';
  END IF;

  INSERT INTO public.coupon_credit_grants (business_id, admin_user_id, amount)
  VALUES (p_business_id, p_admin_user_id, p_amount);

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Descuenta 1 cupon disponible cada vez que se crea un cupon nuevo.
-- Si el negocio no tiene saldo, bloquea el insert con un error legible
-- que la UI del vendedor puede mostrar tal cual.
CREATE OR REPLACE FUNCTION public.consume_coupon_credit()
RETURNS TRIGGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT coupon_credits INTO v_credits
  FROM public.businesses
  WHERE id = NEW.business_id
  FOR UPDATE;

  IF v_credits IS NULL OR v_credits < 1 THEN
    RAISE EXCEPTION 'No tienes cupones disponibles. Pide al administrador que te asigne más.';
  END IF;

  UPDATE public.businesses
  SET coupon_credits = coupon_credits - 1
  WHERE id = NEW.business_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consume_coupon_credit ON public.coupons;
CREATE TRIGGER trg_consume_coupon_credit
  BEFORE INSERT ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.consume_coupon_credit();
