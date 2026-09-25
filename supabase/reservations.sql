-- ============================================================
-- AcambaGo - Apartados (layaway): anticipo + entrega diferida
-- Ejecuta este SQL en el SQL Editor de Supabase (despues de
-- messages.sql, business-branches.sql, products-gallery-and-bank.sql)
-- RLS deshabilitado a proposito: el proyecto usa Clerk para auth,
-- no Supabase Auth, igual que el resto de las tablas.
-- ============================================================

-- Anticipo configurable POR PRODUCTO (no un monto fijo de tienda).
-- NULL = ese producto no admite apartado; el boton "Apartar" no se muestra.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_deposit_amount_check;
ALTER TABLE public.products ADD CONSTRAINT products_deposit_amount_check
  CHECK (deposit_amount IS NULL OR (deposit_amount > 0 AND deposit_amount <= price));

-- Un apartado puede originarse de:
--  a) un producto YA en el catalogo (product_id NOT NULL): precio y anticipo
--     se vuelven a leer de products.price/products.deposit_amount del lado
--     del servidor (create_reservation), nunca se confia en lo que manda el
--     cliente para este caso - mismo principio que create_order_with_items
--     (ver orders-trusted-price.sql). item_name/unit_price/deposit_amount
--     quedan "congelados" (snapshot) aunque el vendedor cambie el producto
--     despues de creado el apartado.
--  b) algo que el vendedor confirma por chat que si tiene pero no esta
--     subido como producto (product_id NULL): el VENDEDOR (no el
--     comprador) define nombre/precio/anticipo al vuelo desde el chat.
CREATE TABLE IF NOT EXISTS public.reservations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id        UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- De que conversacion viene, para poder volver al chat. Nullable porque el
  -- boton "Apartar" en la pagina de producto (catalogo) no obliga a pasar
  -- por el chat primero; el caso "fuera de catalogo" SIEMPRE nace del chat
  -- y la ruta de API exige este campo en ese caso.
  conversation_id    UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  -- Quien aparta (comprador)
  user_id            TEXT NOT NULL,
  customer_name      TEXT NOT NULL,
  customer_phone     TEXT,

  -- Que se aparta: catalogo real, o item libre definido por el vendedor
  product_id         UUID REFERENCES public.products(id) ON DELETE SET NULL,
  item_name          TEXT NOT NULL,
  item_description   TEXT,
  quantity           INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

  -- Montos "congelados" al momento de crear el apartado (snapshot, no una
  -- referencia viva a products.price/deposit_amount que podria cambiar
  -- despues de creado el apartado).
  unit_price         NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  total_amount       NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  deposit_amount     NUMERIC(10,2) NOT NULL CHECK (deposit_amount > 0),
  remaining_amount   NUMERIC(10,2) NOT NULL CHECK (remaining_amount >= 0),

  -- Entrega: el vendedor decide como. NO hay inventario por sucursal (el
  -- traslado fisico entre sucursales lo maneja el vendedor fuera de la app);
  -- branch_id NULL con delivery_method='pickup_branch' significa "sucursal
  -- principal" (la direccion del negocio), para negocios sin sucursales
  -- dadas de alta todavia en business_branches.
  delivery_method    TEXT NOT NULL CHECK (delivery_method IN ('pickup_branch', 'home')),
  branch_id          UUID REFERENCES public.business_branches(id) ON DELETE SET NULL,
  address            JSONB, -- mismo shape que orders.address, solo si delivery_method='home'

  -- Pago del anticipo y del saldo: transferencia (usa businesses.bank_clabe
  -- ya existente, no se duplica aqui) o en persona al recoger/recibir.
  payment_method     TEXT NOT NULL CHECK (payment_method IN ('transfer', 'in_person')),
  deposit_paid_at    TIMESTAMPTZ,
  balance_paid_at    TIMESTAMPTZ,

  -- Ciclo de vida. listo_en_sucursal solo aplica si delivery_method=pickup_branch;
  -- enviado_a_domicilio solo si delivery_method=home (validado en la ruta de
  -- API / RPC de cambio de estado, no con un CHECK cruzado aqui).
  status             TEXT NOT NULL DEFAULT 'reservado'
                       CHECK (status IN ('reservado', 'listo_en_sucursal', 'enviado_a_domicilio', 'entregado', 'cancelado')),

  -- TODO (pendiente de decision del usuario): que pasa con el anticipo al
  -- cancelar. Por ahora solo se registra QUE se cancelo y QUIEN, sin ninguna
  -- logica de reembolso automatico (no hay inventario que restaurar, a
  -- diferencia de cancel_order_and_restore_stock).
  cancelled_at       TIMESTAMPTZ,
  cancelled_by       TEXT CHECK (cancelled_by IN ('customer', 'business')),

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_business_id ON public.reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id     ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status      ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_conversation_id ON public.reservations(conversation_id);

ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;

-- Realtime para que el panel del vendedor y el seguimiento del comprador se
-- actualicen en vivo, mismo patron que orders y messages.
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;


-- ============================================================
-- create_reservation: crea el apartado.
--
-- p_origin = 'catalog' -> el comprador aparta un producto YA en el catalogo.
--   El precio y el anticipo se IGNORAN si el cliente los manda y se vuelven
--   a leer de products.price / products.deposit_amount del lado del
--   servidor (mismo principio que create_order_with_items). Falla si el
--   producto no pertenece a p_business_id o no tiene deposit_amount.
--
-- p_origin = 'custom' -> el VENDEDOR define un item que no esta en el
--   catalogo, desde el chat. Aqui SI se usan p_item_name/p_unit_price/
--   p_deposit_amount tal cual los manda quien llama - pero solo porque la
--   ruta de API ya verifico que p_actor_user_id es el owner_id del negocio
--   ANTES de llamar este RPC, y este RPC lo vuelve a verificar aqui mismo
--   (misma logica de "revalidar ownership dentro de la funcion" que usa
--   redeem_coupon con p_scanning_owner_id) - un comprador nunca puede
--   inventarse su propio precio/anticipo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_origin            TEXT,      -- 'catalog' | 'custom'
  p_business_id       UUID,
  p_actor_user_id     TEXT,      -- quien esta llamando (Clerk userId, ya autenticado en la ruta)
  p_user_id           TEXT,      -- comprador dueño del apartado
  p_customer_name     TEXT,
  p_customer_phone    TEXT,
  p_conversation_id   UUID,
  p_product_id        UUID,      -- NULL si p_origin = 'custom'
  p_item_name         TEXT,      -- ignorado si p_origin = 'catalog' (se toma de products.name)
  p_item_description  TEXT,
  p_unit_price        NUMERIC,   -- ignorado si p_origin = 'catalog'
  p_deposit_amount    NUMERIC,   -- ignorado si p_origin = 'catalog'
  p_quantity          INTEGER,
  p_delivery_method   TEXT,      -- 'pickup_branch' | 'home'
  p_branch_id         UUID,
  p_address           JSONB,
  p_payment_method    TEXT       -- 'transfer' | 'in_person'
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation_id    UUID;
  v_item_name         TEXT;
  v_item_description  TEXT;
  v_unit_price        NUMERIC;
  v_deposit_amount    NUMERIC;
  v_total_amount      NUMERIC;
  v_owner_id          TEXT;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  IF p_delivery_method NOT IN ('pickup_branch', 'home') THEN
    RAISE EXCEPTION 'Método de entrega inválido';
  END IF;

  IF p_delivery_method = 'pickup_branch' AND p_branch_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.business_branches WHERE id = p_branch_id AND business_id = p_business_id) THEN
      RAISE EXCEPTION 'La sucursal no pertenece a este negocio';
    END IF;
  END IF;

  IF p_delivery_method = 'home' AND p_address IS NULL THEN
    RAISE EXCEPTION 'Falta la dirección de entrega';
  END IF;

  IF p_payment_method NOT IN ('transfer', 'in_person') THEN
    RAISE EXCEPTION 'Método de pago inválido';
  END IF;

  IF p_origin = 'catalog' THEN
    -- El comprador aparta su propio apartado: quien llama debe ser el mismo comprador.
    IF p_actor_user_id IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'No autorizado para crear este apartado';
    END IF;

    IF p_product_id IS NULL THEN
      RAISE EXCEPTION 'Falta el producto de catálogo';
    END IF;

    SELECT name, description, price, deposit_amount
    INTO v_item_name, v_item_description, v_unit_price, v_deposit_amount
    FROM public.products
    WHERE id = p_product_id AND business_id = p_business_id;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'El producto no existe o no pertenece a este negocio';
    END IF;
    IF v_deposit_amount IS NULL THEN
      RAISE EXCEPTION 'Este producto no tiene apartado habilitado';
    END IF;

  ELSIF p_origin = 'custom' THEN
    -- Solo el vendedor (dueño del negocio) puede definir precio/anticipo libres.
    SELECT owner_id INTO v_owner_id FROM public.businesses WHERE id = p_business_id;
    IF v_owner_id IS NULL OR v_owner_id IS DISTINCT FROM p_actor_user_id THEN
      RAISE EXCEPTION 'Solo el vendedor puede crear un apartado de un artículo fuera de catálogo';
    END IF;

    IF p_conversation_id IS NULL THEN
      RAISE EXCEPTION 'Un apartado fuera de catálogo debe venir de una conversación';
    END IF;
    IF p_item_name IS NULL OR trim(p_item_name) = '' THEN
      RAISE EXCEPTION 'Falta el nombre del artículo';
    END IF;
    IF p_unit_price IS NULL OR p_unit_price <= 0 THEN
      RAISE EXCEPTION 'El precio debe ser mayor a cero';
    END IF;
    IF p_deposit_amount IS NULL OR p_deposit_amount <= 0 OR p_deposit_amount > p_unit_price * p_quantity THEN
      RAISE EXCEPTION 'El anticipo no es válido';
    END IF;

    v_item_name := p_item_name;
    v_item_description := p_item_description;
    v_unit_price := p_unit_price;
    v_deposit_amount := p_deposit_amount;
  ELSE
    RAISE EXCEPTION 'Origen de apartado inválido';
  END IF;

  v_total_amount := v_unit_price * p_quantity;

  INSERT INTO public.reservations (
    business_id, conversation_id, user_id, customer_name, customer_phone,
    product_id, item_name, item_description, quantity,
    unit_price, total_amount, deposit_amount, remaining_amount,
    delivery_method, branch_id, address, payment_method
  ) VALUES (
    p_business_id, p_conversation_id, p_user_id, p_customer_name, p_customer_phone,
    CASE WHEN p_origin = 'catalog' THEN p_product_id ELSE NULL END,
    v_item_name, v_item_description, p_quantity,
    v_unit_price, v_total_amount, v_deposit_amount, v_total_amount - v_deposit_amount,
    p_delivery_method, p_branch_id, p_address, p_payment_method
  ) RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation TO anon, authenticated;


-- ============================================================
-- update_reservation_status: cambia el estado, revalidando quien puede
-- moverlo a donde (mismo patron de "ownership atomico" que las demas RPC).
-- El vendedor puede mover a cualquier estado valido para su metodo de
-- entrega, excepto que un cancelado o entregado no se pueden volver a
-- cambiar. El comprador SOLO puede cancelar su propio apartado, y solo si
-- todavia no fue entregado ni cancelado.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_reservation_status(
  p_reservation_id UUID,
  p_new_status     TEXT,
  p_actor_user_id  TEXT,
  p_actor_role     TEXT  -- 'customer' | 'business'
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_owner_id TEXT;
  v_buyer_id          TEXT;
  v_current_status    TEXT;
  v_delivery_method   TEXT;
BEGIN
  SELECT b.owner_id, r.user_id, r.status, r.delivery_method
  INTO v_business_owner_id, v_buyer_id, v_current_status, v_delivery_method
  FROM public.reservations r
  JOIN public.businesses b ON b.id = r.business_id
  WHERE r.id = p_reservation_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Apartado no encontrado';
  END IF;

  IF v_current_status IN ('entregado', 'cancelado') THEN
    RAISE EXCEPTION 'Este apartado ya está % y no se puede modificar', v_current_status;
  END IF;

  IF p_new_status NOT IN ('listo_en_sucursal', 'enviado_a_domicilio', 'entregado', 'cancelado') THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;

  IF p_actor_role = 'business' THEN
    IF v_business_owner_id IS DISTINCT FROM p_actor_user_id THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
    IF p_new_status = 'listo_en_sucursal' AND v_delivery_method <> 'pickup_branch' THEN
      RAISE EXCEPTION 'Este apartado no es de recolección en sucursal';
    END IF;
    IF p_new_status = 'enviado_a_domicilio' AND v_delivery_method <> 'home' THEN
      RAISE EXCEPTION 'Este apartado no es a domicilio';
    END IF;
  ELSIF p_actor_role = 'customer' THEN
    IF v_buyer_id IS DISTINCT FROM p_actor_user_id THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
    IF p_new_status <> 'cancelado' THEN
      RAISE EXCEPTION 'El comprador solo puede cancelar su apartado';
    END IF;
  ELSE
    RAISE EXCEPTION 'Rol inválido';
  END IF;

  UPDATE public.reservations
  SET status = p_new_status,
      updated_at = NOW(),
      cancelled_at = CASE WHEN p_new_status = 'cancelado' THEN NOW() ELSE cancelled_at END,
      cancelled_by = CASE WHEN p_new_status = 'cancelado' THEN p_actor_role ELSE cancelled_by END
  WHERE id = p_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_reservation_status TO anon, authenticated;


-- ============================================================
-- mark_reservation_payment: el vendedor marca el anticipo o el saldo como
-- pagado (verificacion manual de transferencia, o cobro en persona). Solo
-- el dueño del negocio puede marcarlo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_reservation_payment(
  p_reservation_id UUID,
  p_which          TEXT, -- 'deposit' | 'balance'
  p_actor_user_id  TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_owner_id TEXT;
BEGIN
  SELECT b.owner_id INTO v_business_owner_id
  FROM public.reservations r
  JOIN public.businesses b ON b.id = r.business_id
  WHERE r.id = p_reservation_id;

  IF v_business_owner_id IS NULL THEN
    RAISE EXCEPTION 'Apartado no encontrado';
  END IF;
  IF v_business_owner_id IS DISTINCT FROM p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_which = 'deposit' THEN
    UPDATE public.reservations SET deposit_paid_at = NOW(), updated_at = NOW() WHERE id = p_reservation_id;
  ELSIF p_which = 'balance' THEN
    UPDATE public.reservations SET balance_paid_at = NOW(), updated_at = NOW() WHERE id = p_reservation_id;
  ELSE
    RAISE EXCEPTION 'Parámetro inválido';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_reservation_payment TO anon, authenticated;
