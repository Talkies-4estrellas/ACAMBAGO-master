# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instrucciones generales

- Siempre responde en español.
- Escribe con la voz de marca de AcambaGo: cercana, directa y orientada a la comunidad local de Acámbaro.
- Nunca uses guiones largos (—). Usa coma, punto y coma o punto según corresponda.
- Si el proyecto no existe aun como paquete Next.js, crealo con `npx create-next-app@latest`.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Next.js 16 Breaking Changes

- **Middleware renamed**: `src/middleware.ts` is deprecated. Use `src/proxy.ts` and export `proxy` (not `middleware`).
- **`ssr: false` in dynamic()**: Only allowed inside Client Components (`"use client"`). Server components must delegate to a client wrapper — see `src/components/map/MapWrapper.tsx`.
- **`useSearchParams()`**: Must be wrapped in `<Suspense>` — see `src/app/(auth)/register/page.tsx`.

## Architecture

> Para contexto de negocio (qué se conectó, en qué orden correr el SQL, qué quedó pendiente), ver `DOCUMENTACION.md`.

### Route Groups

```
src/app/
  (public)/        ← Navbar + Footer layout; public pages
    page.tsx       ← Home / marketplace
    business/[id]/ ← Real business profiles (Supabase)
    business/demo* ← hardcoded demo pages (no Supabase)
    checkout/      ← Real checkout, writes orders/order_items via RPC
    map/           ← Leaflet map
  (auth)/          ← Centered card layout
    login/
    register/
  dashboard/       ← Sidebar + bottom nav layout (seller panel)
    business/      ← products, orders, coupons, reviews, analytics, settings
    PendingApprovalGate.tsx ← blocks the panel until admin approves the business
  admin/           ← Admin approval panel
  api/             ← Route handlers (coupons/validate, businesses, reviews, auth/callback)
```

### Auth (Clerk)

This project uses **Clerk**, not Supabase Auth. `src/proxy.ts` protects `/dashboard`, `/admin`, `/perfil`. Sign-in/sign-up pages are custom (`(auth)/login`, `(auth)/register`), not Clerk's default `/sign-in`/`/sign-up` routes — the `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` env vars point to them. Because of Clerk, all Supabase tables have RLS **disabled** (see `supabase/clerk-migration.sql`) — authorization is enforced in API routes and client code, not Postgres policies.

### Demo Mode

All demo data lives in `src/lib/demo-data.ts`. Demo businesses have fixed IDs (`demo`, `demo-lavado`, etc.) and their own routes under `(public)/business/`. `BusinessCard` maps these IDs to their routes via a `demoSlugs` lookup. The home page merges demo businesses with Supabase results, filtering out any Supabase business whose ID starts with `demo`. Demo data never touches the database — it's a fallback for running the app without any credentials configured.

When Supabase credentials **are** configured (as in this deployment), real businesses/products/orders exist alongside the demo ones. `IS_DEMO` (checked via `NEXT_PUBLIC_SUPABASE_URL`) gates whether a given page reads real data or falls back to demo data.

### Supabase Clients

- `src/lib/supabase/client.ts` — browser client (Client Components)
- `src/lib/supabase/server.ts` — server client (Server Components, Route Handlers)
- `src/lib/supabase/middleware.ts` — session refresh only (no route protection; that's Clerk's `proxy.ts`)

### Orders

Checkout groups cart items by `business_id` and calls the `create_order_with_items` Postgres RPC (see `supabase/orders-rpc.sql`) once per business — order + items are inserted in a single transaction, so a failed item insert can't leave an order with zero products. The seller's `dashboard/business/orders` page subscribes to Supabase Realtime on `orders` INSERT and plays a beep (Web Audio API, no audio file) + shows a toast when a new order arrives.

### QR Coupon Flow

1. Business creates coupon → `generateCouponCode()` produces `ACAM-XXXXXX`
2. QR payload: `JSON.stringify({ coupon_code, business_id })`
3. Client scans with `html5-qrcode` in `QRScanner.tsx`
4. POST to `/api/coupons/validate` → verifies ownership + validity, records redemption

### Key Patterns

- **CSS**: `@import url(...)` for Google Fonts must come before `@tailwind base;` in `globals.css`, or the build fails.
- **Images**: `next/image` is used everywhere; `product-images` and `business-images` are Supabase Storage buckets. Products can have multiple photos (`products.image_urls TEXT[]`, first item = cover/`image_url`), shown via `ProductGallery.tsx` (product page) and `MiniCarousel.tsx` (store cards, auto-advances every 2.5s).
- **Product reels**: `components/ui/ProductsReel.tsx` is the auto-scrolling horizontal carousel (`animate-reel` in `tailwind.config.ts`, pauses on hover) used for "Productos Destacados" on the home page and for each business's own "Productos" section. Optional `stock_quantity`/`is_available` on each item show an "Agotado" badge (disables `AddToCartButton`) or "Últimas X" near the price — callers that don't pass them keep the old behavior (no badge). Nav arrows call `scrollBy({behavior:"smooth"})` but must pause the auto-scroll ref first, or the per-frame `scrollLeft` write cancels the smooth scroll almost instantly.
- **Categories**: `BUSINESS_CATEGORIES` in `src/types/index.ts` — no food/restaurants; only services and physical products.
- **Prices**: Always formatted with `formatPrice()` from `src/lib/utils.ts` (es-MX locale, MXN currency).
- **User geolocation**: `src/lib/user-location-context.tsx` (`UserLocationProvider`, mounted once in `(public)/layout.tsx`) asks for browser geolocation once per session and shares it via `useUserLocation()`. `BusinessCard` uses it with `distanceKm()`/`formatDistance()` (`utils.ts`) to show distance next to the address; silently shows nothing if permission is denied.
- **"Ver en el mapa"**: business cards and the product page link to `/map?business=<id>`. `BusinessMap.tsx` (Leaflet) reads `focusId`, centers on that business at zoom 17, and auto-opens its popup with a highlighted (orange) marker. Same `focusId` prop plumbed through `BusinessMapGoogle.tsx`/`MapWrapper.tsx` for when a Google Maps key is configured.
- **Product search across stores**: `(public)/page.tsx`'s `getProductSearchResults()`/`getDemoProductSearchResults()` search `products` (not just `businesses`) when there's a text query, rendering a "Productos que coinciden" section above the business results. `SearchBar.tsx`'s autocomplete also suggests matching products (not just businesses/categories), each linking straight to `/product/<id>`.
- **Reviews require a delivered order**: `ReviewSection.tsx` posts to `/api/reviews` (not a direct client insert) — that route checks Clerk `auth()` **and** that the user has an `orders` row with `status = 'entregado'` for that business before allowing the insert. The UI shows a "Compra verificada" badge when eligible, or a lock message when logged in without a delivered order.
- **Business trust metrics**: `src/lib/business-metrics.ts` — `getOrderCompletionRate()` (% delivered among resolved orders, `null` if none yet, never a false 0%) and `getAverageResponseTime()` (time from a buyer's first message in a conversation to the seller's first reply, averaged across conversations). Shown as chips next to the star rating in `business/[id]/page.tsx`.
- **Admin mutations must go through an API route, never a direct client-side `supabase.from(...).update()/.delete()`.** Since RLS is disabled, a hidden button is the only client-side gate — with no server check, anyone holding the anon key could call the same mutation directly against Supabase's REST API. Follow the pattern in `/api/admin/businesses` and `/api/admin/users`: `auth()` for a real Clerk session, then `profiles.role === "admin"` fetched server-side, *before* touching the target table. `/api/admin/coupon-credits` was the original example of this pattern.
- **Reverting a demoted owner's role must check their *current* role first.** The old `revert-owner-role.ts` (now inlined in `/api/admin/businesses`) set `role = "client"` whenever a business owner had zero businesses left, with no check for what their role actually was — this demoted an **admin** to `"client"` when an admin created and then rejected their own test business (real incident, 2026-09-11; fix pending in `supabase/restore-admin-role.sql`). Only revert `"business"` → `"client"`; never touch `"admin"`.
- **Image crop + WebP upload**: `src/components/ui/ImageCropUpload.tsx` — Facebook/Instagram-style fixed-aspect crop (`react-easy-crop`) + zoom, converts to WebP via `canvas.toBlob(..., "image/webp", 0.85)` (falls back to whatever the browser actually returns — check `blob.type`, never assume WebP encoded). Supports drag-and-drop onto the upload zone in addition to the file picker, and shows the exact output size (`outputWidth`×`outputHeight`) as a hint. Used for both logo and banner in `crear-tienda/page.tsx` and `dashboard/business/settings/page.tsx`.
- **Admin audit log**: `src/lib/admin-audit.ts`'s `logAdminAction()` inserts into `admin_audit_log` (migration: `supabase/admin-audit-log.sql`, not yet run — see Pending). Always best-effort: a failed insert only `console.error`s, never blocks the action it's logging, since the table may not exist yet in a given environment.
- **Admin notification bell**: `src/app/admin/AdminNotificationBell.tsx` — reuses the shared `notifications` table (same one buyers/sellers already use), filtered by the logged-in admin's `user_id`. Dropdown-on-click (not a link-through page like the seller's `NotificationBell.tsx`), marks all unread as read on open. `POST /api/businesses` inserts one row per admin (`type: "new_business_pending"`) whenever a new store is submitted.
- **Buyer notification bell**: `src/components/ui/NotificationBellDropdown.tsx` — same dropdown pattern as the admin one, generalized to take any `userId` + a `viewAllHref` fallback link. Lives in `(public)/perfil/layout.tsx`'s top-right (desktop only, `hidden lg:flex`), *not* in `DesktopSidebar.tsx` — a global sidebar bell was tried first and removed, since the admin panel's own bell isn't in a global sidebar either, it's in the page's own header. Icon swaps `Bell` ↔ `BellRing` (`animate-pulse`, brand color) based on unread count. Renders through a **portal to `document.body`** positioned with `right: window.innerWidth - rect.right` (not `left`) — the button sits near the right edge of its container, so anchoring by `left` pushed the panel off-screen; anchoring by `right` and opening leftward is the correct default for any bell placed near a right edge. The seller's own bell (`dashboard/layout.tsx`, still `NotificationBell.tsx`) and the mobile top-bar bell (`Navbar.tsx`) were intentionally left untouched — this dropdown is desktop-buyer-only so far.
- **A `role === "client"` branch is easy to forget when adding a nav link that already handles `"admin"`/`"business"`.** Real bug: `Navbar.tsx`'s mobile menu had `dashboardHref = role === "admin" ? "/admin" : "/dashboard/business"` with no client case, so a buyer's "Mi panel" link 404'd into a redirect back to "/" (real incident, 2026-09-11). `DesktopSidebar.tsx` already had the client branch for that same link (pointing to `/mas`) — but `/mas` turned out to be redundant with `/perfil`'s own tabs for a buyer, so both links were removed for `"client"` instead of fixed, rather than pointing them at `/mas`. When adding any role-conditional nav item, check all three roles explicitly, and check whether client's destination is already reachable another way before wiring up a new link.
- **`/perfil` tabs, as of 2026-09-11**: Mi perfil (`perfil/page.tsx`, was "Resumen") · Mis compras · Favoritos · Mis mensajes (private chat, `conversations`) · Mis preguntas (public product Q&A, `product_questions`) · Notificaciones · **Cupones** (`perfil/cupones/page.tsx` — redeemed coupons + "Explorar cupones", moved out of the Mi perfil summary) · Direcciones · Configuración (now also holds a "Crear tienda" submenu link at the bottom). "Todas las tiendas" and the standalone "Editar mi perfil" link were removed — the latter was redundant since Configuración *is* the profile editor.
- **Never write a business's address into the `addresses` table.** `addresses` is the buyer's own **delivery** addresses (used as the shipping destination at checkout, requires the buyer's own phone) — it is not a bookmark list for places of interest. A request to "save a favorited store's address" belongs on the favorite's own card (see `perfil/favoritos/page.tsx`'s "Ver en el mapa" link, same pattern as `BusinessCard.tsx`), never inserted as a row in `addresses`, or it would show up as a selectable delivery destination in checkout.
- **Before building a new catalog/browse page, check whether it already exists and is just unlinked.** Real bug (2026-09-14): the "Productos" nav item (`DesktopSidebar.tsx`, `Navbar.tsx`, `HeroCarousel.tsx`'s hero CTA, `vistos-recientemente/page.tsx`) all pointed to `/#productos` — an anchor scroll to the home page's "Productos Destacados" section — even though a real full-catalog page, `(public)/productos/page.tsx`, had existed since the 2026-07-23 session and was simply never linked from anywhere. Always check for an existing route before proposing a new one.
- **`/productos` (full catalog, as of 2026-09-14)**: category filter (`?category=`, same param name and pill style as the home page's filter, `.eq("businesses.category", ...)`), sort (`?sort=recientes|precio_asc|precio_desc|vendidos` — `vendidos` reuses the real sales-ranking RPC `get_featured_products`, filtering category/`q` in memory since the RPC doesn't accept those), and a plain `<form method="get">` search box (`?q=`, no client JS). No real pagination yet — capped at 90 items (15 rows × 6 cols, the grid's max column count) as a stopgap; if the catalog outgrows that, revisit real pagination. `/menos-de-500` and `/mas-vendidos` were consolidated into this page as sort presets (`?sort=precio_asc`/`?sort=vendidos`) and now only `redirect()` there — note that "menos de $500" is no longer an actual price cap, just ascending price sort, so very expensive products could resurface at the bottom of a large enough catalog (open decision, see Pending).
- **`ProductsReel.tsx` grid mode takes an optional `cols` prop** (default `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) so one page can ask for more columns (`/productos` uses up to `xl:grid-cols-6`) without changing the grid density on every other screen that reuses this same component (favoritos, `/categorias`, a business's own product list, etc.).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in real credentials to enable auth and database features:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_APP_URL=
```

Database schema lives in `supabase/*.sql` — run them in the order listed in `DOCUMENTACION.md` (`schema.sql` → `clerk-migration.sql` → `orders-schema.sql` → `orders-rpc.sql` → `products-gallery-and-bank.sql` → `payments-gateway.sql` → `payments-per-business.sql` → `stripe-connect.sql` → `profile-avatars.sql`).

## Deployment

Production runs on Vercel (`jesus-proyectos/acambago`), connected to the GitHub repo. Env vars are set directly in the Vercel project (not via `vercel.json`). Clerk currently uses **development** keys even in production — see `DOCUMENTACION.md` for what that means and what's needed to switch to a production Clerk instance.

## Pending / Known Issues

> Detalle completo de cómo se encontró cada cosa en `Documentacion/sesiones/` — un archivo por fecha (`sesion-DD-MM-YYYY.md`, índice en `sesiones.md`); ver `sesion-09-09-2026.md`, `sesion-11-09-2026.md` y `sesion-14-09-2026.md`.

- **⚠️ RECORDATORIO — correr `supabase/featured-products-stock.sql`** en el SQL Editor de Supabase en cuanto haya acceso a la base. Actualiza el RPC `get_featured_products` para que también devuelva `stock_quantity`/`is_available`; sin ella, el home, `/categorias` y `/productos?sort=vendidos` no muestran la insignia de "Agotado"/"Últimas X" (las demás páginas del catálogo ya la muestran sin necesitar esta migración).
- **⚠️ RECORDATORIO — correr `supabase/admin-audit-log.sql`**. Sin ella, el panel "Actividad reciente" de `/admin?tab=resumen` se queda vacío (las acciones de aprobar/suspender/eliminar/cambiar rol siguen funcionando igual; solo no queda registro).
- **⚠️ RECORDATORIO — correr `supabase/restore-admin-role.sql`**. Restaura `role = 'admin'` para la cuenta "Talkies" (`user_3Is5wXNSSdqysma2bbLNXSXsz9g`), degradada a `"client"` por un bug real en `revertRoleIfNoBusinesses` (ya corregido en el código — ver sesión 2026-09-11). Mientras no se corra, esa cuenta no puede entrar a `/admin`.
- **Seguridad: RLS deshabilitado en las 17 tablas + llave anónima pública.** Como `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública (va en el bundle del navegador) y no hay RLS ni column-level grants, `businesses.mp_access_token` y `businesses.bank_clabe` son potencialmente legibles por cualquiera vía la API REST de Supabase, sin pasar por Next.js. `grant_coupon_credits` tampoco tiene `GRANT EXECUTE` explícito (a diferencia de `create_order_with_items`), así que probablemente es invocable directo, saltándose la validación de admin de `/api/admin/coupon-credits`. No verificado en vivo (sería extraer secretos reales); pendiente decidir el arreglo (RLS real atado a un claim de Clerk, o revocar columnas/funciones sensibles de `anon`/`authenticated`). **Nota:** las acciones de aprobar/suspender/reactivar/eliminar negocio y cambiar rol de usuario ya se movieron a rutas de API con validación de admin en servidor (`/api/admin/businesses`, `/api/admin/users`), así que ya no dependen únicamente de RLS — pero el resto de las tablas (productos, pedidos, datos bancarios, etc.) sigue expuesto igual.
- **Sin confirmar — panel del vendedor mostró "✓ Negocio aprobado" en una tienda recién creada que en realidad seguía pendiente** (confirmado aparte desde `/admin?tab=negocios`). Visto una sola vez en `dashboard/business/page.tsx`, no investigado a fondo.
- **Sin verificar visualmente — el ícono `BellRing` (estado "no leído") de `NotificationBellDropdown.tsx`.** Confirmado solo por revisión de código y `tsc`/`eslint`; no se pudo forzar una notificación real sin leer para probarlo en vivo (escritura directa a la base bloqueada por el sistema de permisos). Verificar en cuanto llegue una notificación real sin leer.
- **Decisión abierta — "Menos de $500" (`/productos?sort=precio_asc`) ya no tiene un tope real de precio**, solo ordena ascendente. Con el catálogo chico de hoy no se nota; si crece, decidir si hace falta un filtro de precio máximo real aparte del orden.
- **`/productos` sigue sin paginación real** — el límite de 90 (15 filas × 6 columnas) es un techo silencioso, igual que el `.limit(60)` que tenía antes. Retomar si el catálogo crece más allá de eso.
