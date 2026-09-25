-- ============================================================
-- AcambaGo - Devolver el credito al eliminar un cupon
-- Ejecuta este SQL en el SQL Editor de Supabase
--
-- Hallazgo real (revision de Cupones, 2026-09-24): crear un cupon
-- consume 1 credito (trg_consume_coupon_credit en coupon-credits.sql),
-- pero eliminarlo no lo devolvia nunca - un cupon creado por error
-- costaba 1 credito para siempre. Mismo patron que
-- cancel-order-restore-stock.sql (la reserva se hace al crear, hay que
-- revertirla al deshacer). Editar/renovar sigue sin tocar el saldo,
-- solo esto: borrar el cupon.
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_coupon_credit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses
  SET coupon_credits = coupon_credits + 1
  WHERE id = OLD.business_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restore_coupon_credit ON public.coupons;
CREATE TRIGGER trg_restore_coupon_credit
  AFTER DELETE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_coupon_credit();
