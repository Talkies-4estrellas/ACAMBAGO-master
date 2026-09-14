-- ============================================================
-- AcambaGo - Galería de imágenes por producto + datos bancarios reales
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Varias fotos por producto (la primera sigue siendo la portada en image_url,
-- para no romper las tarjetas/listas que ya usan esa columna).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Datos bancarios reales del negocio, para ofrecer "Transferencia" en el
-- checkout con la cuenta real del vendedor en vez de datos inventados.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS bank_name   TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS bank_holder TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS bank_clabe  TEXT;
