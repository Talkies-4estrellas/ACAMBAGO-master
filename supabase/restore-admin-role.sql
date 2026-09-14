-- ============================================================
-- AcambaGo - Restaurar rol de admin (incidente 2026-09-11)
-- Ejecuta este SQL en el SQL Editor de Supabase
--
-- Contexto: revertRoleIfNoBusinesses (ahora dentro de
-- /api/admin/businesses) bajaba el rol del dueño a "client" cada vez
-- que se quedaba sin tiendas, sin fijarse si su rol real era "admin".
-- La cuenta "Talkies" (admin) creo una tienda de prueba para verificar
-- la campana de notificaciones y luego la rechazo desde el propio
-- panel; al quedarse sin tiendas, el sistema la bajo a "client" por
-- error. El bug de fondo ya se corrigio en el codigo (ver sesiones.md,
-- entrada 2026-09-11), pero el dato ya escrito en la base necesita
-- este UPDATE manual para quedar consistente de nuevo.
-- ============================================================

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'user_3Is5wXNSSdqysma2bbLNXSXsz9g'; -- Talkies
