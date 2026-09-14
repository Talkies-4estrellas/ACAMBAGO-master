-- ============================================================
-- AcambaGo - Calculo del descuento sobre el total de la venta
-- Ejecuta este SQL en el SQL Editor de Supabase
--
-- Antes, al confirmar un cupon solo se mostraba "10% de descuento" sin
-- aplicarlo a nada. Ahora el vendedor puede capturar el total de la
-- venta al confirmar el canje, y redeem_coupon() calcula el descuento
-- y el total a cobrar EN EL SERVIDOR (no en el navegador), para que el
-- monto guardado en coupon_redemptions sea siempre el que Postgres
-- calculo con los datos reales del cupon, no uno que pudo ser
-- manipulado del lado del cliente.
-- ============================================================

ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS sale_amount NUMERIC(10,2);
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);

-- Se dropea primero porque cambia el RETURNS TABLE (Postgres no permite
-- que CREATE OR REPLACE le agregue columnas nuevas a la salida).
DROP FUNCTION IF EXISTS public.redeem_coupon(TEXT, UUID, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_coupon_code TEXT,
  p_qr_business_id UUID,
  p_scanning_owner_id TEXT,
  p_customer_user_id TEXT DEFAULT NULL,
  p_confirm BOOLEAN DEFAULT false,
  p_sale_amount NUMERIC DEFAULT NULL
) RETURNS TABLE (
  outcome TEXT,
  message TEXT,
  coupon_id UUID,
  coupon_title TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  out_coupon_code TEXT,
  business_name TEXT,
  redemption_id UUID,
  sale_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC
) AS $$
DECLARE
  v_business public.businesses%ROWTYPE;
  v_coupon public.coupons%ROWTYPE;
  v_outcome TEXT;
  v_message TEXT;
  v_redemption_id UUID;
  v_discount_amount NUMERIC;
  v_final_amount NUMERIC;
BEGIN
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
    ELSE
      -- Calculo del descuento, sea que se vaya a confirmar o solo se este
      -- previsualizando: porcentaje sobre el total, o monto fijo (sin
      -- pasarse del total de la venta, para no dejar un cobro negativo).
      IF p_sale_amount IS NOT NULL THEN
        IF v_coupon.discount_type = 'percent' THEN
          v_discount_amount := ROUND(p_sale_amount * v_coupon.value / 100, 2);
        ELSE
          v_discount_amount := LEAST(v_coupon.value, p_sale_amount);
        END IF;
        v_final_amount := p_sale_amount - v_discount_amount;
      END IF;

      IF p_confirm THEN
        BEGIN
          UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
          INSERT INTO public.coupon_redemptions (coupon_id, user_id, business_id, redeemed_at, sale_amount, discount_amount)
          VALUES (v_coupon.id, p_customer_user_id, p_qr_business_id, NOW(), p_sale_amount, v_discount_amount)
          RETURNING id INTO v_redemption_id;
          v_outcome := 'redeemed';
          v_message := 'Cupón canjeado exitosamente';
        EXCEPTION WHEN unique_violation THEN
          v_outcome := 'duplicate';
          v_message := 'Este cupón ya fue canjeado';
        END;
      ELSE
        v_outcome := 'redeemed';
        v_message := 'Cupón válido';
      END IF;
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
    v_coupon.value, v_coupon.code, v_business.name, v_redemption_id,
    p_sale_amount, v_discount_amount, v_final_amount;
END;
$$ LANGUAGE plpgsql;
