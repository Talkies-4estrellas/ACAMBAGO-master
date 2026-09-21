-- ============================================================
-- AcambaGo - Categorias dinamicas con jerarquia padre/hijo
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth, no
-- Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql).
-- A diferencia del proyecto de referencia (donde crear categoria requiere
-- rol admin/bodega, con un flujo de solicitud/aprobacion para proveedores),
-- aqui cualquier vendedor autenticado puede crear una directo — decision
-- deliberada para no agregar un sistema de moderacion que no se pidio.
-- ============================================================

CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Case-insensitive, escapado por padre: una categoria raiz no se repite
-- entre raices, y una subcategoria no se repite dentro del MISMO padre —
-- pero "Ropa" como raiz y "Ropa" como hija de otra categoria si coexisten.
CREATE UNIQUE INDEX idx_categories_unique_root_name
  ON public.categories (LOWER(name)) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX idx_categories_unique_child_name
  ON public.categories (parent_id, LOWER(name)) WHERE parent_id IS NOT NULL;

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Backfill: las 17 categorias fijas de hoy (BUSINESS_CATEGORIES en
-- src/types/index.ts), como raices, para que nada se rompa el dia uno
-- antes de que alguien cree una propia.
INSERT INTO public.categories (name) VALUES
  ('Tienda de ropa'), ('Zapatería'), ('Farmacia'), ('Ferretería'),
  ('Papelería'), ('Electrónica'), ('Joyería'), ('Accesorios'),
  ('Mueblería'), ('Abarrotes'), ('Cosméticos'), ('Mascotas'),
  ('Artesanías'), ('Deportes'), ('Juguetería'), ('Librería'), ('Otro')
ON CONFLICT DO NOTHING;
