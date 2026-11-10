-- ============================================================
-- AcambaGo - Cupones guardados en la cuenta del comprador
-- Ejecuta este SQL en el SQL Editor de Supabase (despues de
-- schema.sql, clerk-migration.sql y coupon-credits.sql)
--
-- Para que existe: la revista digital ACOM-Di muestra cupones reales de
-- AcambaGo, pero no tiene cuentas. El lector toca "Guardalo en AcambaGo",
-- llega a /cupon/<codigo>?origen=revista, inicia sesion (o crea cuenta) y
-- el cupon queda guardado aqui, con su QR personal (el que lleva user_id),
-- de modo que redeem_coupon pueda impedir que la misma persona lo use dos
-- veces. "origin" deja registrado de donde vino ('revista' o 'app').
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_coupons (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id  UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin     TEXT NOT NULL DEFAULT 'app',
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Guardar el mismo cupon dos veces no duplica nada.
  UNIQUE (coupon_id, user_id)
);

-- Perfil -> Cupones lista "los de este usuario".
CREATE INDEX IF NOT EXISTS idx_saved_coupons_user_id ON public.saved_coupons(user_id);

-- RLS deshabilitado a proposito, igual que el resto de las tablas (el
-- proyecto usa Clerk para auth, no Supabase Auth, ver clerk-migration.sql).
ALTER TABLE public.saved_coupons DISABLE ROW LEVEL SECURITY;

-- A diferencia de las demas tablas, aqui SI se le quita la escritura a la
-- llave anonima: guardar un cupon pasa solo por /api/saved-coupons, que
-- toma el user_id de la sesion de Clerk y usa la llave de servicio (que no
-- se ve afectada por este REVOKE). Sin esto, cualquiera con la llave
-- anonima publica podria insertar filas con el user_id de otra persona, o
-- inflar el conteo de guardados "desde la revista". La lectura queda
-- abierta (Perfil -> Cupones la hace desde el navegador).
REVOKE INSERT, UPDATE, DELETE ON public.saved_coupons FROM anon, authenticated;

-- ------------------------------------------------------------
-- Para la revista: que su panel se actualice solo cuando se crea, cambia
-- o borra un cupon. Se revisa antes de agregarla porque ALTER PUBLICATION
-- ... ADD TABLE falla si la tabla ya estaba, y el SQL Editor corre todo
-- el script como una sola transaccion (un error revertiria tambien la
-- tabla de arriba).
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END $$;
