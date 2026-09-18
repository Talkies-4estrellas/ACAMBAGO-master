-- ============================================================
-- AcambaGo - Sucursales (ubicaciones adicionales de un mismo negocio)
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql).
-- La verificacion de que quien crea la sucursal es dueño del negocio se hace
-- en /api/business-branches, no en Postgres.
-- ============================================================

-- Una sucursal es solo una ubicacion mas del mismo negocio: comparte
-- productos, cupones, categoria, logo, etc. con la tienda "padre"
-- (business_id) — lo unico propio es nombre, direccion, coordenadas y,
-- opcionalmente, un WhatsApp distinto (si no se llena, se usa el del negocio).
CREATE TABLE public.business_branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  whatsapp    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_branches_business_id ON public.business_branches(business_id);

ALTER TABLE public.business_branches DISABLE ROW LEVEL SECURITY;
