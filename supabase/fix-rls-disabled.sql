-- ============================================================
-- AcambaGo - Re-deshabilita RLS (se había reactivado por accidente)
-- Ejecuta este SQL en el SQL Editor de Supabase URGENTE
-- ============================================================

-- Este proyecto usa Clerk para autenticación, NO Supabase Auth. La
-- seguridad se valida en las rutas de la API y en el código del cliente,
-- no con políticas de Postgres. Si RLS queda habilitado, la llave anon
-- (la que usa el navegador) deja de poder leer CUALQUIER fila, aunque
-- los datos sigan existiendo intactos en la base de datos.
ALTER TABLE public.profiles           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items        DISABLE ROW LEVEL SECURITY;
