-- ============================================================
-- AcambaGo - Bitacora de acciones del panel de administrador
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql)
--
-- Concepto: registro de solo-insercion (nunca se edita ni se borra) de
-- cada accion sensible que un admin ejecuta desde /admin: aprobar,
-- suspender, reactivar o eliminar un negocio, y cambios de rol de un
-- usuario. Guarda un "snapshot" del nombre del objetivo (target_label)
-- porque si despues se elimina el negocio o el usuario, el registro
-- historico debe seguir siendo legible.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id TEXT NOT NULL,
  admin_name    TEXT,
  action        TEXT NOT NULL,
  target_type   TEXT NOT NULL, -- 'business' | 'user'
  target_id     TEXT NOT NULL,
  target_label  TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log DISABLE ROW LEVEL SECURITY;
