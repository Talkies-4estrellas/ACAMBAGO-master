-- ============================================================
-- AcambaGo - Mercado Pago por negocio (no una sola cuenta de la plataforma)
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Cada negocio guarda sus propias credenciales de Mercado Pago. El dinero de
-- un pedido se cobra usando la cuenta del negocio dueño de esos productos,
-- no una cuenta central de la plataforma.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS mp_public_key    TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
