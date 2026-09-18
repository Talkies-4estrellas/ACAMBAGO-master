-- ============================================================
-- AcambaGo - Fecha de aprobacion del negocio
-- Ejecuta este SQL en el SQL Editor de Supabase
-- Sirve para saber cuanto tiempo lleva aprobado un negocio (ej. para dejar
-- de mostrar el cartel "Negocio aprobado" despues de un tiempo) sin depender
-- de updated_at, que no se toca automaticamente en cada UPDATE.
-- ============================================================

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Negocios que ya estaban aprobados antes de esta migracion no tienen una
-- fecha real que rescatar, asi que se les da el beneficio de la duda: se
-- cuenta como si se hubieran aprobado justo ahora, en vez de asumir que ya
-- se les vencio el periodo por no tener el dato.
UPDATE public.businesses SET approved_at = NOW() WHERE is_approved = true AND approved_at IS NULL;
