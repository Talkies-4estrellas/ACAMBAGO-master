# AcambaGo — Guía de instalación

## Requisitos previos

1. **Node.js 18+** → https://nodejs.org
2. **Cuenta Supabase** → https://supabase.com (gratis)
3. **Cuenta Clerk** → https://clerk.com (gratis) — la app usa Clerk para login/registro, no Supabase Auth
4. Opcional para funciones extra: **Google Maps API key** (mapa de negocios), **Stripe** (Stripe Connect), **Mercado Pago** (cada negocio conecta el suyo desde su panel, no requiere claves globales)

---

## Paso 1 — Configurar Supabase

En **SQL Editor**, pega y ejecuta estos archivos de `supabase/` **en este orden exacto**:

1. `schema.sql` — tablas base, buckets de Storage
2. `clerk-migration.sql` — migra los IDs a `TEXT` para usar Clerk en vez de Supabase Auth, deshabilita RLS (la autorización se valida en las rutas de la API)
3. `orders-schema.sql` — tablas `orders`/`order_items` + Realtime
4. `orders-rpc.sql` — función `create_order_with_items`
5. `products-gallery-and-bank.sql` — galería de fotos de producto + datos bancarios del negocio
6. `payments-gateway.sql` — columnas de pago en `orders` (`payment_status`, `mp_preference_id`, `mp_payment_id`)
7. `payments-per-business.sql` — credenciales de Mercado Pago por negocio (`mp_public_key`, `mp_access_token`)
8. `stripe-connect.sql` — columnas de Stripe Connect en `businesses`/`orders`
9. `profile-avatars.sql` — bucket `profile-images` para la foto de perfil del comprador

Saltarse el orden o un archivo puede romper foreign keys o dejar columnas faltantes.

---

## Paso 2 — Variables de entorno

Copia `.env.local.example` a `.env.local` y llena los valores:

```bash
cp .env.local.example .env.local
```

- **Supabase** (Settings → API): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Clerk** (Dashboard → API Keys): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. Las páginas de login/registro son propias (`/login`, `/register`), por eso las variables `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` ya vienen precargadas apuntando ahí
- **Stripe** (solo si vas a usar Stripe Connect): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Google Maps** (solo si vas a mostrar el mapa de negocios): `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` (en producción, tu dominio real)

Mercado Pago **no** usa variables de entorno: cada negocio pega su propio `Public Key`/`Access Token` desde `Dashboard → Ajustes` en su panel de vendedor.

---

## Paso 3 — Instalar y ejecutar

```bash
cd acambago
npm install
npm run dev
```

Abre http://localhost:3000

---

## Paso 4 — Crear el primer admin

1. Regístrate normalmente en la app
2. En Supabase → Table Editor → profiles → busca tu registro
3. Cambia el campo `role` de `client` a `admin`
4. Ve a `/admin` en el navegador

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (public)/          → Páginas públicas (home, negocio, mapa)
│   ├── (auth)/            → Login / Registro
│   ├── (dashboard)/       → Panel del negocio
│   ├── admin/             → Panel administrador
│   └── api/               → API Routes (validar cupones, etc.)
├── components/
│   ├── ui/                → Navbar, Footer
│   ├── business/          → BusinessCard, StarRating
│   ├── coupons/           → CouponCard, QRScanner
│   └── map/               → BusinessMap (Leaflet)
├── lib/
│   └── supabase/          → client, server, middleware
├── types/                 → Tipos TypeScript
supabase/
└── schema.sql             → Esquema completo de BD
```

---

## Flujo completo de cupones

1. Negocio crea cupón → se genera código `ACAM-XXXXXX` y datos QR
2. Cliente ve cupón en el perfil del negocio → muestra QR
3. Negocio abre `/dashboard/business/coupons/scan`
4. Presiona "Iniciar cámara" → escanea el QR del cliente
5. Sistema valida: existencia, expiración, límite de usos, duplicados
6. Resultado en pantalla: ✅ válido o ❌ rechazado

---

## Deploy en Vercel

```bash
npm i -g vercel
vercel --prod
```

Agrega las variables de entorno en el dashboard de Vercel.
