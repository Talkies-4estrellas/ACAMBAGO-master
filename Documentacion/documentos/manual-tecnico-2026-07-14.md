# Manual Técnico — AcambaGo (marca "Acom-Di")

> **Generado:** 2026-07-14 | **Modelo:** Claude Opus 4.8 (exploración exhaustiva del código fuente)
> **Dirigido a:** Desarrolladores
> **Stack:** Next.js 16 (App Router) · React 18 · TypeScript · Tailwind CSS 3.4 · Clerk · Supabase · Vercel

---

## 1. Arranque rápido

```bash
npm install
npm run dev      # servidor de desarrollo (next dev)
npm run build    # build de producción
npm run start    # servir el build
npm run lint     # ESLint
```

No hay scripts de seed ni de migración. La app arranca en **modo demo** si no hay credenciales de Supabase, así que `npm run dev` funciona sin configurar nada.

---

## 2. Variables de entorno

En `.env.local` (la raíz trae placeholders para que el build pase):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
# Stripe (plataforma; agregadas en la sesión de la tarde del 2026-07-14)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

> Las credenciales de **Mercado Pago no van en variables de entorno**: cada tienda guarda su propia Public Key / Access Token en `businesses.mp_public_key`/`mp_access_token`. Las viejas `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`/`MERCADOPAGO_ACCESS_TOKEN` (una cuenta global) se eliminaron; ese enfoque quedó descartado porque el dinero debe llegar a cada tienda, no a la plataforma.

Reglas de detección de demo (se repiten en varios archivos):

```ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL
  || SUPABASE_URL.includes("your-project")
  || SUPABASE_URL === "https://placeholder.supabase.co";
```

Si `IS_DEMO` es true, el código usa `src/lib/demo-data.ts` en vez de consultar Supabase. Con URL/KEY reales, `IS_DEMO` es false y todo lo real (pedidos, aprobación, galería, banco) aplica.

> Clerk lee sus llaves de las variables `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`. En producción están en modo desarrollo (`pk_test_`/`sk_test_`).

---

## 3. Base de datos: orden de migraciones

Todos los archivos viven en `supabase/`. Si se recrea la base desde cero, correr en el SQL Editor **en este orden**:

1. **`schema.sql`** — tablas base (`profiles`, `businesses`, `products`, `coupons`, `coupon_redemptions`, `reviews`), triggers, buckets. (Esta versión asume Supabase Auth y RLS.)
2. **`clerk-migration.sql`** — migra a Clerk: elimina el trigger `on_auth_user_created`, borra todas las políticas RLS, `TRUNCATE` de datos, cambia IDs `UUID → TEXT`, restaura PK/FK, **deshabilita RLS en todas las tablas** y abre el Storage.
3. **`orders-schema.sql`** — `orders`, `order_items`, índices, RLS off y `ALTER PUBLICATION supabase_realtime ADD TABLE orders`.
4. **`orders-rpc.sql`** — función `create_order_with_items` + `GRANT EXECUTE` a `anon, authenticated`.
5. **`products-gallery-and-bank.sql`** — `products.image_urls TEXT[]` + `businesses.bank_name/holder/clabe`.
6. **`payments-gateway.sql`** — amplía el CHECK de `orders.payment_method` (agrega `mercadopago`), y agrega `orders.payment_status/mp_preference_id/mp_payment_id`.
7. **`payments-per-business.sql`** — `businesses.mp_public_key/mp_access_token` (credenciales de Mercado Pago por tienda).
8. **`stripe-connect.sql`** — `businesses.stripe_account_id/stripe_charges_enabled`, `orders.stripe_payment_intent_id`, y amplía otra vez el CHECK de `payment_method` (agrega `stripe`).

El **estado final consolidado** (sin historial de migraciones) está en [`sql/tablas.sql`](../sql/tablas.sql), listo como referencia de "cómo están las tablas hoy".

> **Por qué RLS está apagado:** el proyecto usa Clerk, no Supabase Auth. `auth.uid()` no existe en este contexto, así que las políticas RLS originales no aplicarían. La seguridad se hace en el código: las rutas de API validan con `auth()` de Clerk y las consultas del servidor filtran por `owner_id`/`user_id`.
>
> **⚠️ Riesgo conocido (ocurrió el 2026-07-15):** si alguien acepta una sugerencia del "Security Advisor" de Supabase para "activar RLS", vuelve a bloquear TODAS las lecturas del navegador (la llave anon deja de ver cualquier fila, sin error visible, solo arreglos vacíos). Si el sitio empieza a mostrar solo datos demo, o un vendedor deja de ver su propio negocio, correr de nuevo `supabase/fix-rls-disabled.sql` antes de sospechar de otra cosa.

---

## 4. Cómo funciona cada subsistema

### 4.1 Autenticación y roles
- `ClerkProvider` en `src/app/layout.tsx`.
- Rutas propias de login/registro en `(auth)/`; el selector `register` guarda `pending_role` en `localStorage`.
- `onboarding/page.tsx` hace `upsert` del `profile` con el rol elegido y redirige.
- `src/proxy.ts` (Next.js 16: se exporta `proxy`, no `middleware`) protege `/dashboard`, `/admin`, `/perfil` y respeta la cookie `demo_mode`.
- `useAuthUser` (`lib/hooks/use-auth-user.ts`) resuelve `{ userId, name, role, loading }` combinando cookie demo + Clerk + `profiles`.

### 4.2 Clientes de Supabase
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components).
- `lib/supabase/server.ts` — `createServerClient` con cookies (Server Components / rutas de API).
- Muchas páginas importan el server client dinámicamente dentro de un `try/catch` para que el modo demo no truene.

### 4.3 Pedidos
- Carrito: `CartProvider` en memoria (`lib/cart-context.tsx`).
- Checkout (`(public)/checkout/page.tsx`): 5 pasos; en confirmación valida UUIDs, agrupa por negocio y llama al RPC por negocio.
- Vendedor (`dashboard/business/orders/page.tsx`): carga pedidos + `order_items`, se suscribe a Realtime (`orders-<bizId>`), reproduce beep (Web Audio API) y toast al `INSERT`.
- `create_order_with_items`: transacción única pedido + items.

### 4.4 Productos y galerías
- CRUD en `dashboard/business/products/page.tsx`: sube hasta 6 fotos al bucket `product-images`; `image_urls` es el arreglo, `image_url` la portada.
- `ProductsReel` (auto-scroll, `animate-reel` en `tailwind.config.ts`), `MiniCarousel` (avance 2.5s, en `DemoBusinessPage`), `ProductGallery` (detalle de producto: avanza sola cada 2.5s con deslizamiento `translateX`, sin flechas — actualizado 2026-07-15).

### 4.5 Cupones QR
- Crear: `generateCouponCode()` → `ACAM-XXXXXX` (nanoid, alfabeto sin caracteres ambiguos). `qr_data = JSON.stringify({ coupon_code, business_id })`.
- Escanear: `QRScanner` (html5-qrcode, `dynamic` con `ssr: false`) → `POST /api/coupons/validate`.
- Validación (`/api/coupons/validate`): dueño del negocio, `isCouponValid` (activo/vigente/límite), no doble canje, registra redención e incrementa `used_count`.

### 4.6 Aprobación de negocios
- `dashboard/layout.tsx` calcula `pendingApproval`; `PendingApprovalGate.tsx` bloquea todo menos `/dashboard/business/settings`.
- El admin aprueba/suspende desde `/admin?tab=negocios` (`AdminApproveButton`, `AdminBusinessActions`).

### 4.7 Ubicación y banco
- Ajustes (`settings/page.tsx`): botón de geolocalización llena `latitude/longitude`; datos de banco habilitan "Transferencia" en el checkout.

---

## 5. Notas de Next.js 16 (rompen compatibilidad)

- **Middleware → proxy:** el archivo es `src/proxy.ts` y exporta `proxy` (no `middleware`).
- **`dynamic({ ssr: false })`** solo dentro de Client Components; el mapa delega a `MapWrapper.tsx`.
- **`useSearchParams()`** debe ir dentro de `<Suspense>` (ver `checkout/tracking/page.tsx`).
- **`params` y `searchParams` son Promesas** en Server Components: hay que hacer `await` (ver `business/[id]/page.tsx`, `admin/page.tsx`, home).

---

## 6. Convenciones del proyecto

- **Idioma:** todo en español, voz de marca cercana y local. **Nunca guiones largos** (usar coma, punto y coma o punto).
- **Precios:** siempre con `formatPrice()` (`utils.ts`, locale es-MX, MXN).
- **Categorías:** `BUSINESS_CATEGORIES` en `types/index.ts`; **sin comida ni restaurantes**.
- **Imágenes:** `next/image`; buckets `product-images` y `business-images`.
- **CSS:** los `@import` de fuentes de Google en `globals.css` deben ir antes de `@tailwind base;`.

---

## 7. Huecos conocidos y TODOs (verificados en código)

1. **Pagos reales:** resuelto en la sesión de la tarde del 2026-07-14 (ver `sesiones/sesiones.md`). Hay tarjeta real **por tienda** con Mercado Pago (Checkout Pro) y Stripe Connect (destination charges); cada negocio conecta sus propias credenciales y el dinero le llega directo, nunca a la plataforma. La tarjeta simulada solo queda en modo demo. Pendiente menor: reflejar `payment_status` en la UI y manejar reembolsos.
2. **Notificaciones al comprador** (WhatsApp/email) al cambiar el estado del pedido: no existen; solo hay notificación en vivo al vendedor.
3. **Seguimiento de pedido:** la página `checkout/tracking` es una animación demostrativa, no lee el estado real.
4. **Clerk en desarrollo:** banner y límites de uso; pasar a producción requiere dominio verificado.
5. **Desfase git ↔ producción:** los deploys recientes fueron por `vercel --prod` (CLI), no por git; el repo puede estar detrás de lo que está vivo. Sincronizar git antes de asumir que `master` = producción.
6. **Código heredado de Supabase Auth:** `api/auth/callback/route.ts` (usa `exchangeCodeForSession`) y `lib/supabase/middleware.ts` quedaron del esquema anterior y no están en el flujo activo con Clerk. Candidatos a limpieza.

---

## 8. Despliegue

- **Vercel:** proyecto `jesus-proyectos/acambago`, URL `https://acambago-kappa.vercel.app`. Variables de Clerk y Supabase configuradas en el dashboard de Vercel.
- **Build:** `next build`. Sin pasos extra (el esquema SQL no se corre en el build).
- **Recomendación:** volver a hacer los despliegues por git (push a `master`) para que GitHub y producción no se separen.

---

> Documentación complementaria: la [técnica navegable](../documentacion-markdown/documentacion-markdown.md), el [snapshot completo](documentacion-completa-2026-07-14.md), y los manuales de [vendedor](../documentacion-usuario/manual-vendedor.md) y [comprador](../documentacion-usuario/manual-comprador.md).
