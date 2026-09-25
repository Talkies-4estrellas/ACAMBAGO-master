import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/messages";
import { createNotification } from "@/lib/notifications";

const VALID_STATUSES = ["listo_en_sucursal", "enviado_a_domicilio", "entregado", "cancelado"];

const STATUS_LABELS: Record<string, string> = {
  listo_en_sucursal: "listo para recoger en sucursal",
  enviado_a_domicilio: "en camino a tu domicilio",
  entregado: "entregado",
  cancelado: "cancelado",
};

// Cambia el estado de un apartado. El vendedor puede avanzarlo (o
// cancelarlo); el comprador solo puede cancelar el suyo. update_reservation_status
// vuelve a validar todo esto de forma atomica dentro del RPC — este endpoint
// solo determina el rol de quien llama para pasárselo.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reservationId = body.reservation_id;
    const status = body.status;

    if (!reservationId || typeof reservationId !== "string") {
      return NextResponse.json({ error: "Falta el apartado" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, user_id, customer_name, conversation_id, item_name, businesses(owner_id)")
      .eq("id", reservationId)
      .maybeSingle();

    if (!reservation) {
      return NextResponse.json({ error: "Apartado no encontrado" }, { status: 404 });
    }

    const ownerId = (reservation.businesses as unknown as { owner_id: string } | null)?.owner_id ?? null;
    const actorRole = ownerId === userId ? "business" : reservation.user_id === userId ? "customer" : null;
    if (!actorRole) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabase.rpc("update_reservation_status", {
      p_reservation_id: reservationId,
      p_new_status: status,
      p_actor_user_id: userId,
      p_actor_role: actorRole,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const label = STATUS_LABELS[status] ?? status;
    if (reservation.conversation_id) {
      // Ya hay un chat de por medio (siempre el caso para un apartado
      // "custom"): el mensaje ahi mismo trae su propia notificacion, no
      // hace falta una aparte.
      await sendMessage(supabase, {
        conversation_id: reservation.conversation_id,
        sender_role: actorRole,
        sender_id: userId,
        body: `📦 Apartado "${reservation.item_name}" actualizado: ${label}.`,
        recipient_user_id: actorRole === "business" ? reservation.user_id : ownerId ?? "",
        notification_title: "Apartado actualizado",
        notification_link: actorRole === "business" ? "/perfil/apartados" : "/dashboard/business/apartados",
      });
    } else if (actorRole === "business") {
      await createNotification(supabase, {
        user_id: reservation.user_id,
        type: "reservation_status",
        title: `Tu apartado está ${label}`,
        body: reservation.item_name,
        link: "/perfil/apartados",
      });
    } else if (ownerId) {
      await createNotification(supabase, {
        user_id: ownerId,
        type: "new_reservation",
        title: `${reservation.customer_name} canceló su apartado`,
        body: reservation.item_name,
        link: "/dashboard/business/apartados",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en /api/reservations/status:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
