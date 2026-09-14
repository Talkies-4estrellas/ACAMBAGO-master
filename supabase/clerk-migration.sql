-- ============================================================
-- Migración: Supabase Auth → Clerk
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- 1. Eliminar trigger y función de Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Eliminar TODAS las políticas RLS primero (bloquean el cambio de tipo)
DROP POLICY IF EXISTS "Usuarios pueden ver cualquier perfil"          ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil"   ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil"            ON public.profiles;
DROP POLICY IF EXISTS "Negocios aprobados son públicos"               ON public.businesses;
DROP POLICY IF EXISTS "Dueño puede actualizar su negocio"             ON public.businesses;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear negocios"   ON public.businesses;
DROP POLICY IF EXISTS "Productos son públicos"                        ON public.products;
DROP POLICY IF EXISTS "Dueño puede gestionar productos"               ON public.products;
DROP POLICY IF EXISTS "Cupones activos son públicos"                  ON public.coupons;
DROP POLICY IF EXISTS "Dueño puede gestionar cupones"                 ON public.coupons;
DROP POLICY IF EXISTS "Dueño puede ver redenciones de su negocio"     ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Sistema puede insertar redenciones"            ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Reseñas son públicas"                          ON public.reviews;
DROP POLICY IF EXISTS "Usuarios autenticados pueden dejar reseñas"    ON public.reviews;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su reseña"          ON public.reviews;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su reseña"            ON public.reviews;

-- 3. Limpiar datos (fresh start con Clerk)
TRUNCATE public.coupon_redemptions, public.reviews, public.coupons, public.products, public.businesses, public.profiles RESTART IDENTITY CASCADE;

-- 4. Quitar foreign keys
ALTER TABLE public.businesses         DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey;
ALTER TABLE public.reviews            DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.coupon_redemptions DROP CONSTRAINT IF EXISTS coupon_redemptions_user_id_fkey;
ALTER TABLE public.profiles           DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles           DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- 5. Cambiar columnas UUID → TEXT (IDs de Clerk: "user_xxx")
ALTER TABLE public.profiles           ALTER COLUMN id       TYPE TEXT;
ALTER TABLE public.businesses         ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE public.reviews            ALTER COLUMN user_id  TYPE TEXT;
ALTER TABLE public.coupon_redemptions ALTER COLUMN user_id  TYPE TEXT;

-- 6. Restaurar primary key y foreign keys
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.coupon_redemptions ADD CONSTRAINT coupon_redemptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 7. Deshabilitar RLS en todas las tablas
ALTER TABLE public.profiles           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            DISABLE ROW LEVEL SECURITY;

-- 8. Storage: quitar política antigua y agregar una abierta
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Subida publica de imagenes"                  ON storage.objects;

CREATE POLICY "Subida publica de imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('business-images', 'product-images'));
