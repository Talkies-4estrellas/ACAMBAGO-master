import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types";

// Inserta una notificacion persistente para que quede guardada aunque el
// destinatario no este viendo la pantalla en ese momento (a diferencia del
// toast/beep, que solo se ve en vivo). Se llama desde quien CAUSA el evento
// (el vendedor al cambiar el estado, el comprador al hacer una pregunta,
// etc.), no de forma reactiva por Realtime.
export async function createNotification(
  supabase: SupabaseClient,
  params: { user_id: string; type: NotificationType; title: string; body?: string; link?: string }
) {
  await supabase.from("notifications").insert(params);
}
