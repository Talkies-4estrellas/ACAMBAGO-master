-- ============================================================
-- AcambaGo - Mensajeria privada cliente-vendedor
-- Ejecuta este SQL en el SQL Editor de Supabase
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas (ver clerk-migration.sql)
-- ============================================================

CREATE TABLE public.conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  product_id       UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name     TEXT,
  last_message     TEXT,
  last_sender_role TEXT CHECK (last_sender_role IN ('customer', 'business')),
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  business_read_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer', 'business')),
  sender_id       TEXT NOT NULL,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX idx_conversations_user_id     ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id  ON public.messages(conversation_id);

ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      DISABLE ROW LEVEL SECURITY;

-- Habilita Supabase Realtime para que la conversacion se actualice en vivo
-- cuando el cliente o el vendedor mandan un mensaje nuevo.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
