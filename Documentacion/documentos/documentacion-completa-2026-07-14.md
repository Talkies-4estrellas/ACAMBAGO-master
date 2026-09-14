# Documentación Técnica Completa — AcambaGo (marca "Acom-Di")

> **Generada:** 2026-07-14 | **Modelo:** Claude Opus 4.8 (exploración exhaustiva del código fuente)
> **URL producción:** `https://acambago-kappa.vercel.app`
> **Repo:** `https://github.com/Segundo715/ACAMBAGO` (privado)
> **Auth:** Clerk (dev) · **BD:** Supabase (`fdgcodeimqfwzctrjlds`)

---

## 0. Resumen ejecutivo

AcambaGo es un marketplace local de Acámbaro, Guanajuato, construido en Next.js 16 (App Router) + React 18 + Supabase, con autenticación de Clerk. Tres roles: comprador, vendedor y admin. Los negocios se registran, un admin los aprueba, y una vez públicos aparecen en el directorio junto a ~29 negocios de demostración. Los compradores arman un carrito y hacen pedidos que se guardan de forma atómica en Postgres; el vendedor los recibe en vivo (Supabase Realtime + beep). Hay cupones con código QR, reseñas con estrellas, galerías de fotos por producto, transferencia bancaria real opcional y ubicación por geolocalización. La marca visual pública es **Acom-Di**.

Este documento es un snapshot del sistema a la fecha. La documentación técnica navegable está en [`documentacion-markdown.md`](../documentacion-markdown/documentacion-markdown.md); el detalle operativo, en [`manual-tecnico-2026-07-14.md`](manual-tecnico-2026-07-14.md).

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 18 + TypeScript 5 |
| Estilos | Tailwind CSS 3.4 (`darkMode: "class"`), paleta `brand` (verde `#068562`) |
| Auth | Clerk (`@clerk/nextjs` v7, `@clerk/localizations` esES) |
| Base de datos | Supabase / PostgreSQL (`@supabase/ssr`) |
| Tiempo real | Supabase Realtime (tabla `orders`) |
| Mapas | Leaflet + react-leaflet; `@vis.gl/react-google-maps` alterno |
| QR | `html5-qrcode` (leer), `qrcode.react` (generar) |
| Otros | lucide-react, react-hot-toast, nanoid, date-fns, sharp, heic-convert |
| Deploy | Vercel |

Sin scripts de seed ni de migración en `package.json` (a diferencia de otros proyectos del mismo autor). El esquema SQL se aplica a mano en Supabase.

---

## 2. Roles y áreas

| Rol (`profiles.role`) | Área | Protección |
|-----------------------|------|------------|
| `client` (comprador) | `/`, `/perfil`, `/product/[id]`, `/checkout`, `/coupons`, `/map` | `/perfil` protegido por Clerk |
| `business` (vendedor) | `/dashboard/business/*` | Guard de rol en `dashboard/layout.tsx` + `PendingApprovalGate` |
| `admin` | `/admin` | Verificación de rol en `admin/page.tsx` |

---

## 3. Autenticación (Clerk, no Supabase Auth)

- `ClerkProvider` (esES) en el root layout.
- Login/registro con componentes de Clerk en rutas propias `(auth)/login/[[...rest]]` y `(auth)/signup/[[...rest]]`.
- `(auth)/register`: selector Comprador/Vendedor que guarda `pending_role` en `localStorage` y manda a `/signup`.
- `onboarding/page.tsx`: crea el `profile` con el rol elegido (`upsert`) y redirige según rol.
- `src/proxy.ts`: `clerkMiddleware` protege `/dashboard`, `/admin`, `/perfil`; respeta la cookie `demo_mode` (bypass para cuentas demo).
- **RLS deshabilitado en toda la base**: la autorización vive en el código (rutas de API con `auth()`, consultas filtradas por dueño). IDs de usuario en formato `user_xxx` de Clerk (columnas TEXT). ⚠️ El 2026-07-15 se encontró RLS reactivado por accidente en las 8 tablas (probablemente por el Security Advisor de Supabase), lo que bloqueó todas las lecturas del navegador; se corrigió con `supabase/fix-rls-disabled.sql`. Si el sitio solo muestra datos demo o un vendedor deja de ver su negocio, sospechar de esto primero.

---

## 4. Base de datos

Ocho tablas: `profiles`, `businesses`, `products`, `coupons`, `coupon_redemptions`, `reviews`, `orders`, `order_items`. Esquema consolidado en [`sql/tablas.sql`](../sql/tablas.sql).

Piezas notables:
- `businesses`: `is_approved` (control del admin), `bank_name/holder/clabe` (transferencia real), `rating_avg/count` (mantenidos por trigger).
- `products`: `image_urls TEXT[]` (galería, default `'{}'`) + `image_url` (portada).
- `coupons`: `code` único `ACAM-XXXXXX`, `qr_data` con JSON, `used_count`/`limit_count`.
- `orders` + `order_items`: pedidos; `order_items` guarda copia de nombre y precio. Tabla `orders` publicada en Realtime.
- Función `create_order_with_items`: inserta pedido + items en una transacción.
- Trigger `on_review_change` → `update_business_rating()`: recalcula rating al cambiar reseñas.
- Buckets de Storage públicos: `business-images`, `product-images`.

### Orden de migraciones (histórico)
1. `schema.sql` — tablas base con Supabase Auth y RLS.
2. `clerk-migration.sql` — migra a Clerk: quita triggers de `auth.users`, borra políticas RLS, trunca datos, cambia IDs UUID→TEXT, **deshabilita RLS**, abre Storage.
3. `orders-schema.sql` — `orders`, `order_items`, Realtime.
4. `orders-rpc.sql` — `create_order_with_items`.
5. `products-gallery-and-bank.sql` — `image_urls` + columnas de banco.

---

## 5. Home y descubrimiento

`(public)/page.tsx` (Server, `revalidate = 60`) combina negocios demo con negocios reales aprobados (`is_approved` y `is_active`, orden por rating, límite 24), excluyendo negocios reales cuyo id empieza con `demo`. Secciones: hero con buscador, "Productos Destacados" (reel), categorías, "Todas las Tiendas" (grid), CTA y "¿Por qué Acom-Di?". Con `?category=`/`?q=` cambia a vista de resultados.

`BusinessCard` enruta las tiendas demo a `/business/demo-*` vía `demoSlugs`; las reales, a `/business/<uuid>`.

---

## 6. Carruseles y galerías

- **`ProductsReel`**: auto-scroll infinito con `animate-reel` (40s, definido en `tailwind.config.ts`), pausa en hover; cada card con Link invisible + botón "Agregar". En home y en el perfil de cada negocio.
- **`MiniCarousel`**: fotos que avanzan solas cada 2.5s, flechas siempre visibles, puntos y contador. Usado en `DemoBusinessPage.tsx`.
- **`ProductGallery`**: galería con miniaturas en la página de producto; avanza sola cada 2.5s y desliza entre fotos (`translateX` + `transition`), sin flechas — actualizado 2026-07-15.

---

## 7. Pedidos

- Carrito en memoria (`CartProvider`), sin persistencia.
- Checkout de 5 pasos (`checkout/page.tsx`): resumen + teléfono, entrega (pickup/meeting/home), pago (cash/card/transfer/cod/mercadopago/stripe), confirmación, éxito.
- Confirmación real: valida que los productos tengan UUID (rechaza demos con toast), agrupa por negocio y llama `create_order_with_items` por negocio.
- Vendedor recibe pedidos en vivo (Realtime) con beep (Web Audio API) y toast; puede marcar estados y contactar por WhatsApp.
- Pago con tarjeta **real por tienda** vía Mercado Pago y Stripe Connect (agregado en la sesión de la tarde del 2026-07-14; ver `sesiones/sesiones.md`): cada negocio conecta sus credenciales y el dinero cae directo en su cuenta. La tarjeta simulada solo queda en modo demo. Transferencia solo si el negocio tiene CLABE.
- Página de seguimiento con timeline animado (demostrativo).

---

## 8. Vendedor, admin, cupones

- **Vendedor:** inicio con KPIs y gráfica; productos con galería de hasta 6 fotos; pedidos en vivo; cupones (crear + escanear); reseñas; analytics; ajustes con geolocalización y banco. `PendingApprovalGate` bloquea todo menos Ajustes hasta la aprobación.
- **Admin:** tabs Resumen/Negocios/Usuarios; aprueba, suspende y reactiva negocios; ve usuarios por rol.
- **Cupones:** `generateCouponCode()` → `ACAM-XXXXXX`; QR con `{coupon_code, business_id}`; validación en `/api/coupons/validate` (dueño, vigencia, límite, doble canje).

---

## 9. Estado de producción y huecos

| Pieza | Estado |
|-------|--------|
| Auth Clerk | App real, llaves de **desarrollo** |
| Supabase | Proyecto real, esquema completo aplicado |
| Vercel | Desplegado y funcionando |
| GitHub | Privado; puede estar **detrás** de producción (deploys por CLI, no git) |
| Pagos | Tarjeta real por tienda (Mercado Pago + Stripe Connect, sesión de la tarde) / transferencia manual (CLABE real). Simulada solo en demo |
| Notificaciones al comprador | No existen |
| Seguimiento real de pedido | No (animación demo) |
| Código Supabase Auth heredado | Presente sin uso (`api/auth/callback`, `lib/supabase/middleware.ts`) |

---

## 10. Datos que no se pudieron verificar desde el código

- Las **llaves y credenciales reales** de Clerk y Supabase (`.env.local`) no se leyeron; los identificadores citados (app de Clerk, proyecto de Supabase, URL de Vercel) provienen del `DOCUMENTACION.md` raíz escrito esta sesión, no de secretos en el código.
- El **desfase real entre git y producción** es un riesgo señalado en el `DOCUMENTACION.md`, no algo medible desde el árbol de código.

---

> Para procedimientos de setup, variables de entorno y operación, ver [`manual-tecnico-2026-07-14.md`](manual-tecnico-2026-07-14.md).
