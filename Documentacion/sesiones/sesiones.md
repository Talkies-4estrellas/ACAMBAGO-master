# Sesiones de trabajo — AcambaGo (marca "Acom-Di")

> Índice de sesiones de desarrollo. Cada día vive en su propio archivo (`sesion-DD-MM-YYYY.md`), mismo patrón que se usa en otros proyectos — así se puede actualizar la sesión de hoy sin que el archivo de historial crezca sin límite ni se mezcle todo en un solo lugar.

| Fecha | Archivo | Resumen |
|---|---|---|
| 2026-07-14 | [sesion-14-07-2026.md](./sesion-14-07-2026.md) | Conexión de servicios reales (Clerk, Supabase), sistema de pedidos, pagos con tarjeta (Mercado Pago y Stripe Connect por tienda) |
| 2026-07-15 | [sesion-15-07-2026.md](./sesion-15-07-2026.md) | RLS reactivado por accidente (incidente), galería de fotos con deslizamiento |
| 2026-07-20 | [sesion-20-07-2026.md](./sesion-20-07-2026.md) | Pagos reales, pedidos del comprador, Estadísticas/Reseñas/Resumen del vendedor que seguían simulados |
| 2026-07-21 | [sesion-21-07-2026.md](./sesion-21-07-2026.md) | Registro simplificado, varias tiendas por cuenta, carruseles arrastrables, circuito de cupones |
| 2026-07-22 | [sesion-22-07-2026.md](./sesion-22-07-2026.md) | Favoritos de tienda reales, menú móvil, varias pantallas simuladas o rotas |
| 2026-07-23 | [sesion-23-07-2026.md](./sesion-23-07-2026.md) | Home estilo Mercado Libre, vistos recientemente, menú lateral colapsable, experimento de Reels revertido |
| 2026-07-24 | [sesion-24-07-2026.md](./sesion-24-07-2026.md) | Modo Mi cuenta/Mi tienda, direcciones guardadas, inventario, preguntas al vendedor, crash de campanas duplicadas |
| 2026-07-27 | [sesion-27-07-2026.md](./sesion-27-07-2026.md) | Métodos de entrega configurables, información de pedidos incompleta, buzón de mensajería privada |
| 2026-07-28 | [sesion-28-07-2026.md](./sesion-28-07-2026.md) | Línea suelta en el panel móvil, renovar cupones vencidos, `<select>` ilegible en modo oscuro |
| 2026-07-29 | [sesion-29-07-2026.md](./sesion-29-07-2026.md) | Desborde horizontal en celular, editar cupones, saldo de cupones del admin, canje de cupones QR reescrito de raíz |
| 2026-07-31 | [sesion-31-07-2026.md](./sesion-31-07-2026.md) | Espacio muerto en escritorio, página de categorías con productos, favoritos que se perdían, sidebar colapsable |
| 2026-09-09 | [sesion-09-09-2026.md](./sesion-09-09-2026.md) | Auditoría completa de la app, hallazgo de seguridad en RLS, arreglos de Clerk, catálogo con ubicación/stock/búsqueda por producto |
| 2026-09-11 | [sesion-11-09-2026.md](./sesion-11-09-2026.md) | Panel de admin a fondo (seguridad, moderación, notificaciones), incidente de rol de admin, reorganización de `/perfil` |
| 2026-09-14 | [sesion-14-09-2026.md](./sesion-14-09-2026.md) | El link "Productos" nunca llevaba a su catálogo; filtro por categoría, orden, buscador, `/menos-de-500`/`/mas-vendidos` consolidadas ahí, primer commit real del repo, pastillas de categoría con orden alfabético/historial, y categoría propia por producto (puede tener varias) |
| 2026-09-15 | [sesion-15-09-2026.md](./sesion-15-09-2026.md) | Se corrieron las 3 migraciones pendientes; nueva forma de revisar/escribir la base real vía la API REST de Supabase sin el dashboard; bug de `CREATE OR REPLACE FUNCTION` corregido; placeholder de contraseña en inglés arreglado; repaso completo del panel de cliente (9 pestañas) con el pendiente del `BellRing` resuelto; seguridad: el rol ya no sube a "business" hasta que se aprueba la tienda, y el menú del panel ya no revela su estructura mientras está pendiente |
| 2026-09-18 | [sesion-18-09-2026.md](./sesion-18-09-2026.md) | El admin ya solo tiene `/admin`; ajustes al menú de tienda pendiente; parpadeo de íconos corregido; función nueva de Sucursales; logo real en el sidebar; cartel de "Negocio aprobado" con vencimiento a 1 semana; campanas de notificación estandarizadas (ícono lleno + número) en las 3 del proyecto, sin duplicados; empezó la revisión del panel apartado por apartado (Resumen, Productos) |
| 2026-09-21 | [sesion-21-09-2026.md](./sesion-21-09-2026.md) | Sistema completo de categorías dinámicas con jerarquía padre/hijo (portado de otro proyecto, "Orden Express"), con buscador de autocompletado y creación al vuelo, reemplazando la lista fija `BUSINESS_CATEGORIES` en toda la app; bug real de selección con árbol viejo corregido; formulario de producto: reordenar fotos arrastrando (con otro bug real de duplicado corregido), fotos convertidas a WebP real, sin flechitas en los números, "fantasma" de centavos en Precio, y el buscador de categorías arreglado (ya no se mostraba solo a sí mismo) |
| 2026-09-22 | [sesion-22-09-2026.md](./sesion-22-09-2026.md) | Descripción de producto sin recortar en la tarjeta (bug de clases de Tailwind), cuadrícula 5×10 con paginación en "Mis Productos"; eliminar o editar un producto no borraba sus fotos de Storage (hallazgo real: el bucket `product-images` no le da permiso de `DELETE` a la llave anónima, arreglado con una ruta de API con service role); las fotos de producto se veían cortadas en miniatura (cambiado `object-cover` por `object-contain` en 5 pantallas); productos incompletos (sin foto, precio o categoría) ahora se guardan como borrador en vez de bloquear el guardado, ocultos del público en 7 pantallas + `get_featured_products`; el formulario de producto ya no pierde lo escrito al hacer clic afuera (bloqueado al crear, advertencia de guardar/descartar al editar si hubo cambios); "Mis Productos" ahora tiene cambio de vista (tarjetas o lista tipo Excel/punto de venta), orden (alfabético o por fecha de subida) y buscador por nombre; revisión completa en vivo en móvil (375px y 320px) sin bugs encontrados; el límite de fotos por producto subió de 6 a 10; y la descripción del producto ya respeta saltos de línea y párrafos en vez de aplastarse en un solo bloque de texto |

---

**Pendientes activos** (detalle en la última entrada donde se encontró cada uno, y en `CLAUDE.md`):
- Decidir y resolver el hallazgo de seguridad de RLS/llave anónima en las tablas.
- Revisar si el bucket `business-images` (logo/banner de tienda) tiene el mismo hueco de políticas que `product-images` (llave anónima sin permiso de `DELETE`, arreglado 2026-09-22) — no se probó todavía.
- Investigar el "✓ Negocio aprobado" incorrecto en `dashboard/business/page.tsx`.
- Decidir si "Menos de $500" necesita de vuelta un tope real de precio, o se deja como orden simple.
- `/productos` sigue sin paginación real — el límite de 90 es un techo silencioso, igual que antes (distinto de la cuadrícula con paginación que sí tiene "Mis Productos" desde 2026-09-22).
- Idea diferida: contador de productos por pastilla de categoría, para otra sección todavía sin decidir cuál.
- Decidir si forzar contraseña también en cuentas de Google (configuración de Clerk Dashboard) — el usuario decidió dejarlo como está por ahora.
- Verificar en vivo (con sesión real de admin) que el redirect a `/admin` funcione, que "Mi panel" siga ganándole al switcher de vendedor si ese admin también es dueño de una tienda, y que el panel de admin se vea bien con categorías dinámicas.
- Considerar si el desplegable de `UserInfo.tsx` (sidebar de escritorio) debería abrirse también con una sola tienda, para que "Agregar otra tienda"/"Agregar nueva sucursal" sean alcanzables desde ahí.
- Seguir con la lista de "cosas de seguridad" del usuario — faltan los puntos después del rol prematuro y el menú del panel.
- Seguir la revisión apartado por apartado del panel de vendedor — quedan Pedidos, Cupones, Escáner QR, Mensajes, Preguntas, Notificaciones, Reseñas, Estadísticas y Configuración.
- Hacer `git push` — el remoto ya está conectado; confirmar que los commits recientes y los cambios de hoy queden subidos.
- La regla de borrador (2026-09-22) solo bloquea la interfaz pública; un pedido directo por API a un producto `is_draft = true` no está bloqueado a nivel de base. Riesgo bajo, no resuelto.
- "Mis Productos" carga todos los productos del vendedor en una sola consulta sin límite (el buscador y el orden de hoy son en memoria); si una tienda crece a cientos de productos, convendría paginar también la consulta a Supabase.
- Ideas sugeridas para "Mis Productos", no pedidas todavía: pestaña de solo borradores, ordenar por precio, acciones en lote desde la vista de lista.
