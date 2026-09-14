# Documentación Técnica — AcambaGo (marca "Acom-Di")

> **Actualizada:** 2026-07-14
> **URL producción:** `https://acambago-kappa.vercel.app` (Vercel, proyecto `jesus-proyectos/acambago`)
> **Repo:** `https://github.com/Segundo715/ACAMBAGO` (privado)
> **Auth:** Clerk (llaves de desarrollo) · **BD:** Supabase (`fdgcodeimqfwzctrjlds`)

---

## 1. ¿Qué es AcambaGo?

AcambaGo, presentada al público con la marca visual **Acom-Di**, es un marketplace local para el municipio de Acámbaro, Guanajuato. Conecta a tres tipos de usuario:

| Rol | Dónde entra | Qué hace |
|-----|-------------|----------|
| **Comprador** (`client`) | `/`, `/perfil`, `/product/[id]`, `/checkout` | Explora tiendas y productos, arma su carrito, hace pedidos, deja reseñas, canjea cupones |
| **Vendedor** (`business`) | `/dashboard/business/*` | Administra su tienda: productos con fotos, cupones QR, pedidos en vivo, datos bancarios y ubicación |
| **Admin** (`admin`) | `/admin` | Aprueba negocios nuevos, los suspende o reactiva, ve usuarios y métricas globales |

El modelo de negocio es de **directorio + pedidos**: AcambaGo **no cobra comisiones ni concentra el dinero**. El valor está en dar visibilidad a los negocios locales y facilitar el contacto comprador-vendedor (WhatsApp, recoger en tienda, punto de reunión, envío a domicilio). Desde 2026-07-14 (tarde) hay pagos con tarjeta reales vía **Mercado Pago** y **Stripe Connect**, pero conectados **por tienda**: cada negocio pone sus propias credenciales y el dinero de cada venta cae directo en la cuenta del vendedor, nunca en una cuenta de la plataforma (ver §9.5).

Convención del proyecto: **no hay comida ni restaurantes**. `BUSINESS_CATEGORIES` solo incluye servicios y productos físicos (ropa, ferretería, farmacia, electrónica, etc.).

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router). Dev con `next dev` |
| UI | React 18 + TypeScript 5 |
| Estilos | Tailwind CSS 3.4 (`darkMode: "class"`), color de marca `brand` |
| Auth | **Clerk** (`@clerk/nextjs` v7, localización `esES`) |
| Base de datos | Supabase / PostgreSQL (`@supabase/ssr`, `@supabase/supabase-js`) |
| Realtime | Supabase Realtime (canal `postgres_changes` sobre `orders`) |
| Mapas | Leaflet + react-leaflet (y `@vis.gl/react-google-maps` como alternativa) |
| QR | `html5-qrcode` (leer) + `qrcode.react` (generar) |
| Íconos | `lucide-react` |
| Toasts | `react-hot-toast` |
| Códigos | `nanoid` (códigos de cupón) |
| Fechas | `date-fns` |
| Imágenes | `next/image`, `sharp` y `heic-convert` como devDependencies |
| Deploy | Vercel |

> El `package.json` **no tiene scripts de seed** ni de migración; el esquema se aplica a mano en el SQL Editor de Supabase. Scripts disponibles: `dev`, `build`, `start`, `lint`.

### 2.1 Decisiones de arquitectura clave

- **Clerk en lugar de Supabase Auth.** Toda la autenticación la maneja Clerk. En Supabase, **RLS está deshabilitado en todas las tablas** a propósito (ver `clerk-migration.sql`); la autorización se valida en el código: rutas de API con `auth()` de Clerk, y consultas del servidor filtradas por `owner_id`/`user_id`. Los IDs de usuario son `TEXT` con formato `user_xxx` de Clerk, no UUID.
- **Modo demo sin credenciales.** Si `NEXT_PUBLIC_SUPABASE_URL` está vacío o es un placeholder, la app corre 100% con datos falsos de `src/lib/demo-data.ts`. La constante `IS_DEMO` se recalcula en cada componente que la necesita.
- **Datos demo mezclados con reales.** Aunque haya Supabase real, los ~29 negocios demo se siguen mostrando en el home, combinados con los negocios aprobados de la base. Nunca tocan la base de datos.
- **Checkout atómico.** Los pedidos se guardan con un RPC de Postgres (`create_order_with_items`) que inserta pedido + productos en una sola transacción.

---

## 3. Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                 # Root: ClerkProvider (esES) + ThemeProvider + Toaster + script anti-flash de tema
│   ├── globals.css
│   │
│   ├── (public)/                  # Layout con Navbar + Footer + CartRoot
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Home / marketplace (Server Component)
│   │   ├── business/[id]/page.tsx # Perfil de negocio real (Supabase) o demo
│   │   ├── business/[id]/ReviewSection.tsx
│   │   ├── business/demo-*/page.tsx  # ~17 páginas demo hardcodeadas (una por tienda demo)
│   │   ├── product/[id]/page.tsx  # Detalle de producto (demo o Supabase)
│   │   ├── product/[id]/ProductGallery.tsx
│   │   ├── category/[name]/page.tsx
│   │   ├── checkout/page.tsx      # Checkout de 5 pasos
│   │   ├── checkout/tracking/page.tsx  # Seguimiento (animación demo)
│   │   ├── coupons/page.tsx
│   │   ├── map/page.tsx           # Mapa Leaflet
│   │   └── perfil/page.tsx        # Panel del comprador
│   │
│   ├── (auth)/                    # Layout de tarjeta centrada
│   │   ├── login/[[...rest]]/page.tsx   # <SignIn> de Clerk
│   │   ├── signup/[[...rest]]/page.tsx  # <SignUp> de Clerk
│   │   └── register/page.tsx      # Selector Comprador vs Vendedor (guarda pending_role)
│   │
│   ├── onboarding/page.tsx        # Tras registrarse: crea profile con el rol elegido y redirige
│   │
│   ├── dashboard/                 # Panel del vendedor (layout propio con sidebar + bottom nav)
│   │   ├── layout.tsx             # Guard de rol + cálculo de pendingApproval
│   │   ├── PendingApprovalGate.tsx
│   │   ├── DashboardNav.tsx
│   │   ├── page.tsx               # Redirige a /dashboard/business
│   │   └── business/
│   │       ├── page.tsx           # Inicio del panel (KPIs, gráfica, acciones rápidas)
│   │       ├── products/page.tsx  # CRUD de productos con galería de fotos
│   │       ├── orders/page.tsx    # Pedidos + Realtime + beep
│   │       ├── coupons/page.tsx
│   │       ├── coupons/new/page.tsx
│   │       ├── coupons/scan/page.tsx  # Escáner QR
│   │       ├── reviews/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── settings/page.tsx  # Datos del negocio, ubicación, banco
│   │
│   ├── admin/                     # Panel de administración
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Tabs: Resumen / Negocios / Usuarios
│   │   ├── AdminNav.tsx
│   │   ├── AdminApproveButton.tsx
│   │   └── AdminBusinessActions.tsx
│   │
│   └── api/
│       ├── businesses/route.ts    # POST: crear negocio
│       ├── coupons/validate/route.ts  # POST: validar y canjear cupón
│       ├── reviews/route.ts       # POST: dejar reseña
│       ├── mercadopago/create-preference/route.ts  # POST: preferencia con token del negocio
│       ├── mercadopago/webhook/route.ts            # POST: confirma pago (server-to-server)
│       ├── stripe/connect/route.ts                 # POST/GET: cuenta Express + estado
│       ├── stripe/create-checkout-session/route.ts # POST: destination charge
│       ├── stripe/webhook/route.ts                 # POST: confirma PaymentIntent (firma)
│       └── auth/callback/route.ts # (heredado de Supabase Auth; ver §12)
│
├── components/
│   ├── business/BusinessCard.tsx  # Tarjeta de tienda (con mapa de slugs demo)
│   ├── business/DemoBusinessPage.tsx  # Página completa de una tienda demo (usa MiniCarousel)
│   ├── business/StarRating.tsx
│   ├── coupons/CouponCard.tsx
│   ├── coupons/QRScanner.tsx      # html5-qrcode
│   ├── map/BusinessMap.tsx, BusinessMapGoogle.tsx, MapWrapper.tsx
│   └── ui/
│       ├── Navbar.tsx, Footer.tsx, DesktopSidebar.tsx, MobileNav.tsx
│       ├── CartRoot.tsx, CartDrawer.tsx, AddToCartButton.tsx
│       ├── ProductsReel.tsx       # Carrusel auto-scroll (animate-reel)
│       ├── MiniCarousel.tsx       # Carrusel de fotos con avance cada 2.5s
│       ├── ShareButton.tsx
│       ├── ThemeProvider.tsx, ThemeToggle.tsx
│       ├── DemoBanner.tsx, DemoLoginButtons.tsx
│       ├── LogoutButton.tsx, UserInfo.tsx
│
├── lib/
│   ├── supabase/client.ts         # Browser client
│   ├── supabase/server.ts         # Server client (cookies)
│   ├── supabase/middleware.ts     # (refresco de sesión; ver §12)
│   ├── stripe/server.ts           # Cliente Stripe de la plataforma (STRIPE_SECRET_KEY)
│   ├── cart-context.tsx           # CartProvider en memoria
│   ├── demo-data.ts               # ~29 negocios + productos + cupones + reseñas hardcodeados
│   ├── demo-mode.ts               # Cuentas demo (cookie demo_mode)
│   ├── clerk-appearance.ts
│   ├── hooks/use-auth-user.ts     # Une Clerk + profile + demo mode
│   └── utils.ts                   # formatPrice, generateCouponCode, isCouponValid, cn
│
├── types/index.ts                 # Tipos y BUSINESS_CATEGORIES
└── proxy.ts                       # Middleware de Clerk (Next.js 16: proxy, no middleware)
```

---

## 4. Modelo de datos

El esquema final consolidado está en [`sql/tablas.sql`](../sql/tablas.sql). Resumen de tablas:

| Tabla | Para qué | Notas |
|-------|----------|-------|
| `profiles` | Perfil de cada usuario de Clerk | `id` es TEXT (`user_xxx`). `role`: `client` / `business` / `admin` |
| `businesses` | Tiendas | `owner_id` → `profiles.id`. Campos de banco (`bank_*`), credenciales de Mercado Pago (`mp_public_key`, `mp_access_token`), Stripe Connect (`stripe_account_id`, `stripe_charges_enabled`), `is_approved`, `is_active`, `rating_avg/count` |
| `products` | Catálogo | `image_urls TEXT[]` (galería) + `image_url` (portada = primer elemento) |
| `coupons` | Cupones | `code` único (`ACAM-XXXXXX`), `qr_data` con JSON, `used_count`/`limit_count` |
| `coupon_redemptions` | Canjes | Un registro por canje |
| `reviews` | Reseñas | 1 por `(business_id, user_id)`. Trigger recalcula `rating_avg/count` |
| `orders` | Pedidos | `status`, `delivery_method`, `payment_method`, `payment_status`, `address` JSONB, totales, campos de pasarela (`mp_preference_id`, `mp_payment_id`, `stripe_payment_intent_id`). En Realtime |
| `order_items` | Renglones de un pedido | Guardan copia de `name` y `price` al momento de la compra |

### 4.1 Tipos TypeScript (`src/types/index.ts`)

Los tipos espejo del esquema: `Profile`, `Business`, `Product`, `Coupon`, `CouponRedemption`, `Review`, `Order`, `OrderItem`, más los union types:

```ts
type UserRole      = "client" | "business" | "admin";
type DiscountType  = "percent" | "fixed";
type OrderStatus   = "pendiente" | "en_camino" | "entregado" | "cancelado";
type DeliveryMethod = "pickup" | "meeting" | "home";
type PaymentMethod = "cash" | "card" | "transfer" | "cod" | "mercadopago" | "stripe";
```

`BUSINESS_CATEGORIES` (16 categorías, sin comida):
Tienda de ropa, Zapatería, Farmacia, Ferretería, Papelería, Electrónica, Joyería, Mueblería, Abarrotes, Cosméticos, Mascotas, Artesanías, Deportes, Juguetería, Librería, Otro.

---

## 5. Autenticación y roles (Clerk)

- **Proveedor.** `ClerkProvider` con localización `esES` envuelve toda la app en `src/app/layout.tsx`.
- **Rutas de login/registro propias.** No se usan las rutas por defecto de Clerk. Están en `(auth)/login/[[...rest]]` y `(auth)/signup/[[...rest]]` (rutas catch-all opcionales que montan `<SignIn>`/`<SignUp>`). `(auth)/register` es un selector previo: el usuario elige "Soy Comprador" o "Tengo una Tienda", se guarda `pending_role` en `localStorage` (`client` o `business`) y se manda a `/signup`.
- **Onboarding.** Tras registrarse, `onboarding/page.tsx` lee `pending_role`, hace `upsert` en `profiles` con ese rol (solo si no es demo) y redirige a `/dashboard/business` (vendedor) o `/perfil` (comprador).
- **Protección de rutas.** `src/proxy.ts` usa `clerkMiddleware`. Rutas protegidas: `/dashboard(.*)`, `/admin(.*)`, `/perfil(.*)`. Además tiene un bypass de **modo demo por cookie** (`demo_mode`): un `buyer` no puede entrar a `/dashboard` (lo manda a `/perfil`), un `seller` sí.
- **Hook `useAuthUser`.** Combina tres fuentes: cookie demo (si existe, devuelve `DEMO_BUYER`/`DEMO_SELLER`), usuario de Clerk, y el `profile` de Supabase (para `name` y `role`). Si el usuario de Clerk no tiene profile aún, cae a `client`.

> Next.js 16: el middleware se llama `proxy` y se exporta como `proxy` (no `middleware`), en `src/proxy.ts`.

---

## 6. Modo demo

Dos cosas distintas comparten la palabra "demo":

1. **Datos demo (`src/lib/demo-data.ts`).** ~29 negocios (`DEMO_BUSINESSES` + `DEMO_BUSINESSES_EXTRA`), cada uno con productos, cupones y reseñas hardcodeados, más `DEMO_PRODUCT_EXTRAS` (fotos, stock, características, precio original) para las páginas de producto. Se muestran **siempre**, mezclados con los negocios reales aprobados. El home los filtra por categoría/búsqueda y luego concatena con los de Supabase, excluyendo cualquier negocio real cuyo `id` empiece con `demo`. `BusinessCard` mapea los IDs demo a sus rutas propias (`/business/demo-*`) vía el objeto `demoSlugs`.

2. **Cuentas demo (`src/lib/demo-mode.ts`).** Para probar la app sin cuenta real. `startDemoMode("buyer"|"seller")` pone la cookie `demo_mode` y redirige. Trae datos falsos de comprador (`DEMO_BUYER`, pedidos, favoritos, cupones, notificaciones) y de vendedor (`DEMO_SELLER`, notificaciones). El `proxy.ts` respeta esa cookie para saltarse Clerk.

3. **Modo demo por falta de credenciales.** Si `NEXT_PUBLIC_SUPABASE_URL` está vacío o es placeholder, `IS_DEMO = true` en cada página y se usan datos demo en vez de consultar Supabase. Con credenciales reales (como en producción), `IS_DEMO = false` y todo lo real aplica.

---

## 7. Home / marketplace (`(public)/page.tsx`)

Server Component con `revalidate = 60`.

1. `getBusinesses(category, search)`: si hay Supabase real, consulta `businesses` con `is_approved = true` y `is_active = true`, ordenados por `rating_avg` desc, limitado a 24; filtra por categoría y busca por nombre. En modo demo devuelve `[]`.
2. Filtra los negocios demo por los mismos criterios de categoría/búsqueda.
3. Combina: `[...demos filtrados, ...supabase.filter(id no empieza con "demo")]`.
4. **Vista sin filtros:** hero con foto de la parroquia, buscador, "Productos Destacados" (reel de 15 productos demo curados, constante `FEATURED`), "Explorar por Categoría" (6 destacadas + resto), "Todas las Tiendas" (grid de `BusinessCard`), CTA para publicar tienda y sección "¿Por qué Acom-Di?".
5. **Vista filtrada** (con `?category=` o `?q=`): chips de categorías + grid de resultados.

---

## 8. Carrusel de productos (`ProductsReel`) y galerías

### 8.1 ProductsReel
Carrusel horizontal de auto-scroll. Duplica los items (`[...items, ...items]`) y aplica la animación CSS `animate-reel`, definida en `tailwind.config.ts` como `reel-scroll 40s linear infinite` (de `translateX(0)` a `translateX(-50%)`). Se pausa al pasar el mouse (`hover:[animation-play-state:paused]`). Cada tarjeta tiene un `<Link>` invisible que cubre toda la card salvo el botón "Agregar" (`AddToCartButton`, con `z-10`). Se usa en:
- Home, "Productos Destacados" (`FEATURED`).
- Perfil de negocio real (`business/[id]`), sección "Productos", con los productos reales de esa tienda.

### 8.2 MiniCarousel
Carrusel de fotos de un producto: avanza solo cada 2.5s (`setInterval`), tiene flechas siempre visibles (pensadas para móvil/touch), contador `n/total` y puntos. Se usa dentro de **`DemoBusinessPage.tsx`** (las páginas de tienda demo), no en la `BusinessCard` real.

### 8.3 ProductGallery
En la página de detalle de producto (`product/[id]/ProductGallery.tsx`): imagen principal + miniaturas. Las imágenes salen de `DEMO_PRODUCT_EXTRAS[id].images` o de `product.image_urls`/`image_url`, con un fallback de Unsplash. Avanza sola cada 2.5s (mismo patrón que `MiniCarousel`), pero **sin flechas**: el cambio entre fotos es un deslizamiento continuo (`transform: translateX(...)` con `transition`, un `<div>` en `flex` con todas las imágenes en fila), no un corte de golpe. La navegación manual queda solo en los puntos indicadores y las miniaturas de abajo (clic en cualquiera cambia `selected` directamente).

---

## 9. Sistema de pedidos (checkout)

### 9.1 Carrito
`CartProvider` (`src/lib/cart-context.tsx`) mantiene el carrito **en memoria** (sin persistencia). `CartItem`: `{ id, business_id, name, price, quantity }`. Expone `addItem`, `removeItem`, `updateQty`, `clearCart`, `total`, `count`, y el estado del drawer (`isCartOpen`). Se monta vía `CartRoot` en el layout público.

### 9.2 Checkout de 5 pasos (`(public)/checkout/page.tsx`)
Pasos: **1 Resumen** (edita cantidades, teléfono de contacto, notas), **2 Entrega** (pickup / punto de reunión / domicilio), **3 Pago**, **4 Confirmación**, **5 Éxito**.

- El **teléfono de contacto** se pide siempre en el Paso 1 (antes solo en envío a domicilio).
- **Entrega:**
  - `pickup`: recoger en tienda. En modo real consulta las tiendas del carrito (`pickupBusinesses`) y muestra dirección + enlace a Google Maps si hay `latitude/longitude`.
  - `meeting`: punto de reunión, de una lista demo (`DEMO_MEETING_POINTS`).
  - `home`: envío a domicilio (+`SHIPPING_COST` = 35). Formulario de dirección.
- **Pago:** `cash`, `card`, `transfer`, `cod`, `mercadopago`, `stripe`. Las opciones se arman dinámicamente según las tiendas del carrito (`pickupBusinesses`):
  - **Tarjeta simulada (`card`):** solo en **modo demo**. Formulario con validación de formato y banner "Modo Demo: no se procesará ningún cargo real". En modo real esta tarjeta simulada **ya no aparece** (se quitó al conectar pasarelas reales).
  - **Transferencia:** solo aparece si al menos un negocio del carrito tiene `bank_clabe` configurado (`businessesWithBank`). Muestra los datos bancarios **reales** del negocio (banco, titular, CLABE con botón de copiar). En modo demo usa `DEMO_BANK_DETAILS`.
  - **Mercado Pago (`mercadopago`):** solo si **todas** las tiendas del carrito tienen `mp_public_key` (`pickupBusinesses.every(b => b.mp_public_key)`). Ver §9.5.
  - **Tarjeta con Stripe (`stripe`):** solo si **todas** las tiendas del carrito tienen `stripe_charges_enabled = true`. Ver §9.5.
- **Confirmación (`handleConfirm`):**
  - En demo (o sin usuario): genera un ID falso `ACAM-XXXXX`, limpia el carrito y va al Paso 5.
  - En real: primero **valida que cada item tenga `id` y `business_id` con formato UUID** (`UUID_RE`). Si hay un producto demo (ids como `"p1"`), muestra un toast pidiendo quitarlo y no continúa (no truena).
  - Agrupa el carrito por `business_id` (`byBusiness`) y llama al RPC `create_order_with_items` **una vez por negocio**, con sus items. Cada llamada guarda pedido + items atómicamente. Guarda el primer `order_id` para el seguimiento.
  - Con `mercadopago` o `stripe`, si el carrito tiene productos de **más de una tienda**, se bloquea con un toast (una preferencia/sesión solo cobra a nombre de un vendedor); hay que hacer un pedido por tienda. Tras guardar el pedido, se llama a la ruta de la pasarela y se redirige (`window.location.href`) a `init_point` (Mercado Pago) o `url` (Stripe). Si la pasarela falla, el pedido ya quedó guardado y se avisa al comprador.
  - Si un usuario real no está logueado, `useEffect` lo redirige a `/login?redirect_url=/checkout`.

### 9.5 Pagos con tarjeta reales, por tienda (Mercado Pago y Stripe Connect)

**Requisito de negocio:** el dinero de cada venta debe caer **directo en la cuenta de la tienda vendedora**, nunca en una cuenta central de AcambaGo. Por eso ambas pasarelas se conectan **por negocio** y cada cobro usa la cuenta del vendedor dueño del pedido. La plataforma no es intermediaria del dinero.

**Mercado Pago (Checkout Pro):**
- Cada tienda guarda sus propias `mp_public_key`/`mp_access_token` en Ajustes (§10.7).
- `POST /api/mercadopago/create-preference` recibe `{ orderId }`, verifica que el pedido sea del usuario, busca el `mp_access_token` **del negocio dueño del pedido** y con ese token crea la preferencia. En la `notification_url` embebe `?business_id=<id>`. Guarda `mp_preference_id` y devuelve `init_point`.
- `POST /api/mercadopago/webhook?business_id=<id>` (server-to-server, sin sesión): lee `business_id` del query, recupera el token de ese negocio, **vuelve a consultar el pago con la API** (no confía en el body), mapea `approved→pagado` / `rejected→fallido` y actualiza `orders.payment_status`/`mp_payment_id`.

**Stripe Connect (destination charges):**
- La cuenta de AcambaGo es la **plataforma** (`STRIPE_SECRET_KEY`, cliente en `src/lib/stripe/server.ts`). Cada tienda tiene su cuenta conectada **Express** propia.
- `POST /api/stripe/connect`: crea (si no existe) la cuenta Express del negocio del vendedor (`type: "express"`, `country: "MX"`, capacidades `card_payments` + `transfers`), guarda `stripe_account_id` y devuelve un Account Link de onboarding hospedado por Stripe. `GET /api/stripe/connect`: consulta `charges_enabled` de la cuenta y sincroniza `stripe_charges_enabled`.
- `POST /api/stripe/create-checkout-session` recibe `{ orderId }` y crea una Checkout Session en modo `payment` con `payment_intent_data.transfer_data.destination = <stripe_account_id del negocio>`: es un **destination charge**, el dinero se transfiere a la cuenta del vendedor. Guarda `order_id` en la metadata del PaymentIntent y `stripe_payment_intent_id` en el pedido; devuelve `url`.
- `POST /api/stripe/webhook`: verifica la firma con `STRIPE_WEBHOOK_SECRET`, escucha `payment_intent.succeeded`/`payment_intent.payment_failed`, lee `order_id` de la metadata y actualiza `orders.payment_status`/`stripe_payment_intent_id`. Registrado en el dashboard con ámbito "Tu cuenta" (el PaymentIntent nace en la plataforma).

> **Nota operativa Stripe (v1):** el código usa la API v1 (Express accounts + Account Links). Stripe ya no la permite por defecto en cuentas nuevas; hubo que activar "Accounts v1 support" en el dashboard (Configuración → Funciones de la cuenta).

### 9.3 RPC `create_order_with_items`
Función PL/pgSQL que inserta el `order` y luego, en la misma transacción, todos los `order_items` desde un `jsonb_array`. Devuelve el `order_id`. Razón de existir (documentada en `orders-rpc.sql`): antes se hacían dos inserts sueltos; si el segundo fallaba (p. ej. producto demo con id no-UUID), quedaba un pedido sin productos y Realtime notificaba a medias. Con el RPC, o se guarda todo o nada.

### 9.4 Seguimiento (`checkout/tracking/page.tsx`)
Timeline de 5 estados (recibido → preparando → listo → en camino → entregado) que **avanza solo cada 4s** como demostración visual. El mapa "en vivo" es un placeholder. Envuelto en `<Suspense>` porque usa `useSearchParams()` (requisito de Next.js 16).

---

## 10. Panel del vendedor (`/dashboard/business`)

### 10.1 Layout y guard (`dashboard/layout.tsx`)
Server Component. Si no es demo:
1. `auth()` de Clerk; sin `userId` → `/login`.
2. Lee `profile.role`; si no es `business` ni `admin` → `/`.
3. Si es `business`, consulta su negocio y calcula `pendingApproval = !business || !business.is_approved`.
Renderiza sidebar (desktop) + barra superior y bottom nav (móvil), y envuelve el contenido en `PendingApprovalGate`.

### 10.2 PendingApprovalGate
Si `pendingApproval` es true y la ruta **no** es `/dashboard/business/settings`, bloquea todo el panel con una pantalla de "Tu negocio está pendiente de aprobación" y un botón a Configuración. Así un vendedor recién registrado puede completar/editar sus datos pero no usa el resto hasta que un admin lo apruebe.

### 10.3 Inicio (`business/page.tsx`)
KPIs (ingresos, pedidos pendientes, productos, calificación), gráfica de barras CSS de 7 días, acciones rápidas y pedidos recientes. Los conteos de productos/cupones/reseñas/canjes son reales (consultas `count` a Supabase); ingresos, gráfica y "pedidos recientes" son demostrativos. Si el usuario no tiene negocio, muestra "Registra tu negocio".

### 10.4 Productos (`business/products/page.tsx`)
CRUD real. Formulario modal con galería de **hasta 6 fotos** (`MAX_IMAGES = 6`): la primera es la portada. Al guardar, sube cada archivo nuevo al bucket `product-images` y arma `image_urls`; `image_url = image_urls[0]`. En modo demo muestra `DEMO_PRODUCTS` y bloquea alta/edición/borrado con un toast.

### 10.5 Pedidos (`business/orders/page.tsx`)
- Carga los pedidos del negocio (`orders` + `order_items`) del usuario logueado.
- **Realtime:** se suscribe al canal `orders-<bizId>` con filtro `business_id=eq.<id>`; al `INSERT` de un pedido nuevo, trae sus items, lo agrega arriba de la lista, **suena un beep** (Web Audio API, oscilador seno a 880 Hz, sin archivo de audio) y muestra un toast con ícono de campana.
- Tabs por estado, búsqueda, y acciones: marcar como enviado / entregado (update de `status`), y contactar al cliente por WhatsApp (`wa.me/52...`).

### 10.6 Cupones (`business/coupons/*`)
- `coupons/new`: crea un cupón; `generateCouponCode()` produce `ACAM-XXXXXX` (nanoid con alfabeto sin caracteres ambiguos), y `qr_data` = `JSON.stringify({ coupon_code, business_id })`.
- `coupons/scan`: escáner. `QRScanner` (html5-qrcode, `ssr: false`) lee el QR, hace `POST /api/coupons/validate` y muestra el resultado.

### 10.7 Ajustes (`business/settings/page.tsx`)
- Datos generales (nombre, descripción, categoría, dirección, WhatsApp, foto → bucket `business-images`).
- **Ubicación:** botón "Usar mi ubicación actual" que pide geolocalización al navegador (`navigator.geolocation.getCurrentPosition`) y llena `latitude/longitude`. Queda una opción manual escondida en un `<details>`. Default: 20.0319, -100.7273 (Acámbaro).
- **Datos bancarios (opcional):** `bank_name`, `bank_holder`, `bank_clabe`. Si se llenan, habilitan "Transferencia" en el checkout.
- **Mercado Pago (opcional):** sección donde el vendedor pega su propia `mp_public_key` y `mp_access_token` (Access Token como campo password). Habilita "Mercado Pago" en el checkout de su tienda.
- **Stripe (opcional):** botón "Conectar con Stripe" que llama a `POST /api/stripe/connect` y redirige al onboarding de Stripe. Al volver con `?stripe_return=1` re-consulta `GET /api/stripe/connect` y, si `chargesEnabled`, muestra "Stripe conectado y listo para recibir pagos". Si el negocio aún es nuevo, pide registrarlo primero.
- Si el negocio es nuevo, primero hace `upsert` del profile con rol `business` y crea el negocio con `is_approved = false`.

---

## 11. Panel de administración (`/admin`)

Server Component con tabs por query (`?tab=resumen|negocios|usuarios`). Verifica que `profile.role === "admin"`; si no, redirige. Carga en paralelo: negocios pendientes (con nombre del dueño), todos los negocios, todos los usuarios y el conteo de productos.

- **Resumen:** tarjetas de pendientes / aprobados / usuarios / productos + lista corta de pendientes.
- **Negocios:** pendientes de aprobación (con `AdminBusinessActions` para aprobar/rechazar) y aprobados (con acciones de suspender/reactivar). `AdminApproveButton` aprueba directo.
- **Usuarios:** conteo por rol (admin/negocio/cliente) y tabla completa.

En modo demo usa una lista fija de usuarios y `DEMO_BUSINESSES`, sin acciones reales.

---

## 12. API Routes

| Ruta | Método | Qué hace |
|------|--------|----------|
| `/api/businesses` | POST | Crea un negocio (requiere `auth()` de Clerk). Inserta con `is_approved = false` y actualiza el rol del profile a `business` |
| `/api/coupons/validate` | POST | Valida y canjea un cupón. Verifica que quien escanea es dueño del negocio (`owner_id = userId`), valida el cupón (`isCouponValid`), evita doble canje por usuario, registra la redención e incrementa `used_count` |
| `/api/reviews` | POST | Inserta una reseña (`user_id = userId` de Clerk). Maneja el error `23505` (ya dejó reseña) con 409 |
| `/api/mercadopago/create-preference` | POST | Crea la preferencia de Checkout Pro con el `mp_access_token` **del negocio dueño del pedido**. Devuelve `init_point`. Ver §9.5 |
| `/api/mercadopago/webhook` | POST | Server-to-server. Lee `business_id` del query, re-consulta el pago con la API y actualiza `payment_status`/`mp_payment_id`. Ver §9.5 |
| `/api/stripe/connect` | POST / GET | POST: crea la cuenta Express del negocio y devuelve el Account Link de onboarding. GET: consulta `charges_enabled` y sincroniza `stripe_charges_enabled`. Ver §9.5 |
| `/api/stripe/create-checkout-session` | POST | Crea la Checkout Session con `transfer_data.destination` a la cuenta del negocio (destination charge). Devuelve `url`. Ver §9.5 |
| `/api/stripe/webhook` | POST | Verifica la firma (`STRIPE_WEBHOOK_SECRET`), escucha `payment_intent.succeeded`/`payment_intent.payment_failed` y actualiza `payment_status`/`stripe_payment_intent_id`. Ver §9.5 |
| `/api/auth/callback` | GET | **Heredado de Supabase Auth** (`exchangeCodeForSession`). Con Clerk ya no forma parte del flujo real; ver nota abajo |

> **Nota sobre código heredado:** `api/auth/callback/route.ts` y `lib/supabase/middleware.ts` provienen de la etapa con Supabase Auth. Con Clerk el login no pasa por ahí. Se dejaron en el repo pero no son parte del flujo activo. Al documentar o refactorizar, trátalos como legado.

`isCouponValid` (en `utils.ts`) valida: activo, no expirado, y que `used_count < limit_count` (si hay límite).

---

## 13. Mapa

`(public)/map/page.tsx` usa Leaflet vía `MapWrapper` (Client Component, porque `ssr: false` en `dynamic()` solo se permite en Client Components en Next.js 16). Muestra los negocios con `latitude/longitude`. Hay también `BusinessMapGoogle.tsx` como alternativa con `@vis.gl/react-google-maps`.

---

## 14. Temas (claro/oscuro)

`darkMode: "class"`. Un script inline en `layout.tsx` aplica la clase `dark` antes del render (lee `localStorage.theme` o la preferencia del sistema) para evitar el parpadeo. `ThemeProvider` + `ThemeToggle` gestionan el cambio.

---

## 15. Producción y despliegue

- **Vercel:** `https://acambago-kappa.vercel.app`, proyecto `jesus-proyectos/acambago`, con Clerk (llaves `pk_test_`/`sk_test_`, modo desarrollo) y Supabase reales configurados.
- **GitHub:** `https://github.com/Segundo715/ACAMBAGO` (privado).
- **Hueco conocido:** los últimos despliegues se hicieron con `vercel --prod` desde la CLI, **no** por git. Es posible que el repo de GitHub esté detrás de lo que está vivo en producción. Al retomar, conviene sincronizar git antes de asumir que `master` refleja producción.

---

## 16. Pendientes / no incluido (verificado en código)

- **Pagos reales:** ya hay tarjeta real vía **Mercado Pago** y **Stripe Connect**, conectados por tienda (§9.5). La tarjeta *simulada* solo queda en modo demo. Pendiente: reflejar `payment_status` en la UI del vendedor/comprador y manejar reembolsos.
- **Notificaciones al comprador** (WhatsApp/email) cuando cambia el estado de su pedido: no existen. Solo hay notificación en vivo al vendedor.
- **Seguimiento real:** la página de tracking es una animación demo; no lee el estado real del pedido.
- **Clerk en modo desarrollo:** banner y límites; pasar a producción requiere dominio propio verificado.
- **Código heredado de Supabase Auth** (`api/auth/callback`, `lib/supabase/middleware.ts`) sigue en el repo sin uso activo.

---

> Documentación generada leyendo el código fuente real de AcambaGo. Para el detalle de setup y operación, ver el [manual técnico](../documentos/manual-tecnico-2026-07-14.md); para el uso, los manuales de [vendedor](../documentacion-usuario/manual-vendedor.md) y [comprador](../documentacion-usuario/manual-comprador.md).
