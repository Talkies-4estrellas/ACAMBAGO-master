-- Permite a cada negocio activar o desactivar sus métodos de entrega disponibles.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS meeting_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS home_enabled BOOLEAN NOT NULL DEFAULT true;
