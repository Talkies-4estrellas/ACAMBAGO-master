-- ============================================================
-- AcambaGo - Direcciones guardadas del comprador
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Un comprador puede guardar varias direcciones (casa, trabajo, etc.) y
-- reutilizarlas en el checkout en vez de escribirlas de nuevo cada vez.
-- RLS deshabilitado a propósito, igual que el resto de las tablas (el
-- proyecto usa Clerk, no Supabase Auth).
CREATE TABLE IF NOT EXISTS public.addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT 'Casa',
  street     TEXT NOT NULL,
  notes      TEXT,
  colonia    TEXT,
  zip        TEXT,
  city       TEXT NOT NULL DEFAULT 'Acámbaro, Gto.',
  phone      TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);
