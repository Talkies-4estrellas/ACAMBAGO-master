import type { SupabaseClient } from "@supabase/supabase-js";

// Métricas de confianza reales del negocio, calculadas de datos que ya
// existían (orders, messages) pero nunca se mostraban al comprador. No
// dependen de que el vendedor las capture manualmente.

/**
 * % de pedidos que terminaron entregados, contando solo pedidos ya
 * resueltos (entregado o cancelado). Un pedido "pendiente"/"en_camino"
 * todavía no se puede juzgar, así que no cuenta para el total.
 * Devuelve null si el negocio todavía no tiene ningún pedido resuelto
 * (nunca 0%, sería injusto para una tienda nueva sin historial).
 */
export async function getOrderCompletionRate(
  supabase: SupabaseClient,
  businessId: string
): Promise<{ rate: number | null; delivered: number; resolved: number }> {
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("business_id", businessId)
    .in("status", ["entregado", "cancelado"]);

  const rows = (data ?? []) as { status: string }[];
  const resolved = rows.length;
  const delivered = rows.filter((o) => o.status === "entregado").length;

  return {
    rate: resolved > 0 ? Math.round((delivered / resolved) * 100) : null,
    delivered,
    resolved,
  };
}

/**
 * Tiempo promedio entre el primer mensaje de un comprador en cada
 * conversación y la primera respuesta del vendedor a ese mensaje. Solo
 * mide el primer contacto de cada conversación (no cada turno), que es lo
 * que le importa a un comprador antes de escribir.
 */
export async function getAverageResponseTime(
  supabase: SupabaseClient,
  businessId: string
): Promise<{ avgMs: number | null; label: string | null }> {
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", businessId);

  const conversationIds = (conversations ?? []).map((c: { id: string }) => c.id);
  if (conversationIds.length === 0) return { avgMs: null, label: null };

  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, sender_role, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  const rows = (messages ?? []) as { conversation_id: string; sender_role: string; created_at: string }[];

  const firstCustomerMsgAt = new Map<string, number>();
  const responseTimes: number[] = [];

  for (const m of rows) {
    const t = new Date(m.created_at).getTime();
    if (m.sender_role === "customer") {
      if (!firstCustomerMsgAt.has(m.conversation_id)) {
        firstCustomerMsgAt.set(m.conversation_id, t);
      }
    } else if (m.sender_role === "business") {
      const customerAt = firstCustomerMsgAt.get(m.conversation_id);
      // Ya se contó la respuesta a este primer mensaje (o no ha escrito el
      // cliente todavía): se borra la marca para no medir turnos siguientes.
      if (customerAt != null) {
        responseTimes.push(t - customerAt);
        firstCustomerMsgAt.delete(m.conversation_id);
      }
    }
  }

  if (responseTimes.length === 0) return { avgMs: null, label: null };

  const avgMs = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;
  return { avgMs, label: formatResponseTime(avgMs) };
}

function formatResponseTime(ms: number): string {
  const minutes = ms / 60000;
  if (minutes < 60) return "minutos";
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return `${Math.round(days)} día${Math.round(days) === 1 ? "" : "s"}`;
}
