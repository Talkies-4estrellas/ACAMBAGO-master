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
| 2026-09-18 | [sesion-18-09-2026.md](./sesion-18-09-2026.md) | El admin ya solo tiene `/admin` (sin lado de comprador/tienda) y maneja su propio perfil ahí mismo; ajustes al menú de tienda pendiente; bug real de parpadeo de íconos en la barra pública corregido; tienda de prueba aprobada y panel revisado a fondo; función nueva de Sucursales (ubicaciones ligadas a la tienda principal); logo real en vez del ícono genérico en el sidebar |

---

**Pendientes activos** (detalle en la última entrada donde se encontró cada uno, y en `CLAUDE.md`):
- **Correr `supabase/business-branches.sql` y `supabase/business-approved-at.sql`** en el SQL Editor de Supabase (confirmado vía la API REST que ninguna se ha corrido) — sin esto, la función de Sucursales no funciona y el cartel "Negocio aprobado" nunca vence.
- Decidir y resolver el hallazgo de seguridad de RLS/llave anónima.
- Investigar el "✓ Negocio aprobado" incorrecto en `dashboard/business/page.tsx`.
- Decidir si "Menos de $500" necesita de vuelta un tope real de precio, o se deja como orden simple.
- `/productos` sigue sin paginación real — el límite de 90 es un techo silencioso, igual que antes.
- Idea diferida: contador de productos por pastilla de categoría, para otra sección todavía sin decidir cuál.
- Confirmar que el selector de categorías del formulario de producto se ve y guarda bien, con la cuenta real que ya tiene tienda propia.
- Decidir si forzar contraseña también en cuentas de Google (configuración de Clerk Dashboard) — el usuario decidió dejarlo como está por ahora.
- Verificar en vivo (con sesión real de admin) que el redirect a `/admin` funcione y que "Mi panel" siga ganándole al switcher de vendedor si ese admin también es dueño de una tienda.
- Considerar si el desplegable de `UserInfo.tsx` (sidebar de escritorio) debería abrirse también con una sola tienda, para que "Agregar otra tienda"/"Agregar nueva sucursal" sean alcanzables desde ahí.
- Seguir con la lista de "cosas de seguridad" del usuario — faltan los puntos después del rol prematuro y el menú del panel.
- Hacer `git push` — el remoto ya está conectado; confirmar que los commits recientes y los cambios de hoy queden subidos.
