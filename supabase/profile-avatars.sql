-- ============================================================
-- Foto de perfil del comprador (profiles.avatar_url)
-- Ejecutar después de clerk-migration.sql
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Subida publica de imagenes" ON storage.objects;
CREATE POLICY "Subida publica de imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('business-images', 'product-images', 'profile-images'));

DROP POLICY IF EXISTS "Imágenes de negocios son públicas" ON storage.objects;
CREATE POLICY "Imágenes de negocios son públicas" ON storage.objects
  FOR SELECT USING (bucket_id IN ('business-images', 'product-images', 'profile-images'));
