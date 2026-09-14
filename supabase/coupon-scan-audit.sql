-- ============================================================
-- AcambaGo - Auditoria y canje atomico de cupones (escaner QR)
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql)
--
-- Este archivo resuelve dos huecos del flujo de canje anterior
-- (supabase/schema.sql + api/coupons/validate/route.ts):
--   1. El canje se hacia con un INSERT + UPDATE separados desde el
--      cliente de Supabase (dos llamadas HTTP en paralelo, sin
--      transaccion), con used_count calculado en JS. Dos escaneos
--      simultaneos del mismo cupon podian "perder" un incremento o
--      dejar pasar mas canjes que el limite configurado.
--   2. Solo se guardaban los canjes EXITOSOS; no habia forma de
--      saber cuantos intentos fallaron y por que (vencido, ya usado,
--      tienda incorrecta, codigo invalido), util para detectar fraude.
-- ============================================================

-- Historial de CADA intento de escaneo (exitoso o no), a diferencia de
-- coupon_redemptions que solo guarda los canjes que sí se concretaron.
-- "phase" distingue el escaneo inicial (solo lectura, antes de que el
-- vendedor confirme) de la confirmacion real (donde se marca como usado).
CREATE TABLE IF NOT EXISTS public.coupon_scan_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID,                 -- sin FK a proposito: se registra aunque el id no exista (posible intento fraudulento)
  coupon_id        UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  scanned_code     TEXT NOT NULL,
  scanned_by       TEXT NOT NULL,        -- Clerk user id del vendedor que escaneo
  customer_user_id TEXT,                 -- Clerk user id del cliente, si el QR lo traia
  phase            TEXT NOT NULL CHECK (phase IN ('scan', 'confirm')),
  outcome          TEXT NOT NULL CHECK (outcome IN (
                     'redeemed', 'duplicate', 'invalid_code', 'inactive',
                     'expired', 'limit_reached', 'wrong_business'
                   )),
  detail           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_scan_log_business ON public.coupon_scan_log(business_id);
CREATE INDEX IF NOT EXISTS idx_coupon_scan_log_coupon   ON public.coupon_scan_log(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_scan_log_created  ON public.coupon_scan_log(created_at);

ALTER TABLE public.coupon_scan_log DISABLE ROW LEVEL SECURITY;

-- Refuerza a nivel de base de datos que un mismo cliente no puede canjear
-- el mismo cupon dos veces (antes esto solo se checaba con un SELECT previo
-- desde la API, sin garantia real contra condiciones de carrera).
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_unique_customer
  ON public.coupon_redemptions(coupon_id, user_id)
  WHERE user_id IS NOT NULL;

-- Valida (y, si p_confirm=true, canjea) un cupon en una sola transaccion
-- atomica. Se llama dos veces desde la UI de escaneo:
--   1. p_confirm=false al leer el QR: solo valida y regresa la info del
--      cliente/cupon para que el vendedor la revise (sin tocar nada).
--   2. p_confirm=true al tocar "Confirmar canje": vuelve a validar con un
--      row lock (FOR UPDATE) y, si sigue siendo valido, marca el cupon
--      como usado. El row lock es lo que evita que dos escaneos del mismo
--      cupon al mismo tiempo pasen ambos el limite de usos.
-- Siempre deja un registro en coupon_scan_log, sea cual sea el resultado.
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_coupon_code TEXT,
  p_qr_business_id UUID,
  p_scanning_owner_id TEXT,
  p_customer_user_id TEXT DEFAULT NULL,
  p_confirm BOOLEAN DEFAULT false
) RETURNS TABLE (
  outcome TEXT,
  message TEXT,
  coupon_id UUID,
  coupon_title TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  out_coupon_code TEXT,
  business_name TEXT,
  redemption_id UUID
) AS $$
DECLARE
  v_business public.businesses%ROWTYPE;
  v_coupon public.coupons%ROWTYPE;
  v_outcome TEXT;
  v_message TEXT;
  v_redemption_id UUID;
BEGIN
  -- Asignacion explicita a NULL: en la ruta "wrong_business" nunca se llega
  -- a buscar el cupon (se rechaza antes por el negocio), y sin esto Postgres
  -- trata a v_coupon como "no asignada todavia" al llegar al INSERT/RETURN
  -- de mas abajo, aunque sea %ROWTYPE. Con esta asignacion, v_coupon.id y
  -- compania simplemente valen NULL en esa ruta, sin error.
  v_business := NULL;
  v_coupon := NULL;

  SELECT * INTO v_business
  FROM public.businesses b
  WHERE b.id = p_qr_business_id;

  IF v_business.id IS NULL THEN
    v_outcome := 'invalid_code';
    v_message := 'Cupón inválido';
  ELSIF v_business.owner_id <> p_scanning_owner_id THEN
    v_outcome := 'wrong_business';
    v_message := 'Este cupón pertenece a otra tienda';
  ELSE
    IF p_confirm THEN
      -- Row lock: si otro escaneo del MISMO cupon esta a medio confirmar,
      -- este SELECT espera a que termine antes de leer used_count, para
      -- no basar la decision en un valor desactualizado.
      SELECT c.* INTO v_coupon
      FROM public.coupons c
      WHERE c.code = p_coupon_code AND c.business_id = p_qr_business_id
      FOR UPDATE;
    ELSE
      SELECT c.* INTO v_coupon
      FROM public.coupons c
      WHERE c.code = p_coupon_code AND c.business_id = p_qr_business_id;
    END IF;

    IF v_coupon.id IS NULL THEN
      v_outcome := 'invalid_code';
      v_message := 'Cupón inválido';
    ELSIF NOT v_coupon.is_active THEN
      v_outcome := 'inactive';
      v_message := 'Este cupón está desactivado';
    ELSIF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      v_outcome := 'expired';
      v_message := 'Este cupón ya venció';
    ELSIF v_coupon.limit_count IS NOT NULL AND v_coupon.used_count >= v_coupon.limit_count THEN
      v_outcome := 'limit_reached';
      v_message := 'Este cupón ya alcanzó su límite de usos';
    ELSIF p_customer_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.coupon_redemptions r
      WHERE r.coupon_id = v_coupon.id AND r.user_id = p_customer_user_id
    ) THEN
      v_outcome := 'duplicate';
      v_message := 'Este cupón ya fue canjeado';
    ELSIF p_confirm THEN
      BEGIN
        UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
        INSERT INTO public.coupon_redemptions (coupon_id, user_id, business_id, redeemed_at)
        VALUES (v_coupon.id, p_customer_user_id, p_qr_business_id, NOW())
        RETURNING id INTO v_redemption_id;
        v_outcome := 'redeemed';
        v_message := 'Cupón canjeado exitosamente';
      EXCEPTION WHEN unique_violation THEN
        -- Otra transaccion concurrente alcanzo a registrar este mismo
        -- cliente+cupon justo entre el chequeo de arriba y este insert;
        -- el UPDATE de used_count se revierte junto con este bloque.
        v_outcome := 'duplicate';
        v_message := 'Este cupón ya fue canjeado';
      END;
    ELSE
      -- Paso de solo-escaneo (p_confirm=false): todo valido, pero no se
      -- marca nada todavia, se espera a que el vendedor confirme.
      v_outcome := 'redeemed';
      v_message := 'Cupón válido';
    END IF;
  END IF;

  INSERT INTO public.coupon_scan_log (
    business_id, coupon_id, scanned_code, scanned_by, customer_user_id, phase, outcome, detail
  ) VALUES (
    COALESCE(v_business.id, p_qr_business_id),
    v_coupon.id,
    p_coupon_code,
    p_scanning_owner_id,
    p_customer_user_id,
    CASE WHEN p_confirm THEN 'confirm' ELSE 'scan' END,
    v_outcome,
    v_message
  );

  RETURN QUERY SELECT
    v_outcome, v_message, v_coupon.id, v_coupon.title, v_coupon.discount_type,
    v_coupon.value, v_coupon.code, v_business.name, v_redemption_id;
END;
$$ LANGUAGE plpgsql;
