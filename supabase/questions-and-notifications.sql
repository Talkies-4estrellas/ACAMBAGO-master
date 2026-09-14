-- ============================================================
-- AcambaGo - Preguntas al vendedor + notificaciones persistentes
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================

-- Un comprador pregunta algo sobre un producto; el vendedor responde.
-- Publica (como en Mercado Libre) para que otros compradores tambien
-- vean la respuesta. RLS deshabilitado a proposito, igual que el resto
-- de las tablas (el proyecto usa Clerk, no Supabase Auth).
CREATE TABLE IF NOT EXISTS public.product_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_questions DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS product_questions_product_id_idx ON public.product_questions(product_id);
CREATE INDEX IF NOT EXISTS product_questions_business_id_idx ON public.product_questions(business_id);
CREATE INDEX IF NOT EXISTS product_questions_user_id_idx ON public.product_questions(user_id);

-- Notificaciones persistentes: hasta ahora los avisos (pedido nuevo,
-- cambio de estado) solo existian como toast/beep en el momento; si no
-- estabas viendo la pantalla, se perdian. user_id puede ser un
-- comprador o el dueno de un negocio, segun a quien le llegue el aviso.
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
