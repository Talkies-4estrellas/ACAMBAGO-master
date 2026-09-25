import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

// El vendedor marca el anticipo o el saldo como recibido (verificacion
// manual de una transferencia, o cobro en persona) — sin gateway de pago.
// mark_reservation_payment ya rechaza si quien llama no es el dueño del
// negocio.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reservationId = body.reservation_id;
    const which = body.which;

    if (!reservationId || typeof reservationId !== "string") {
      return NextResponse.json({ error: "Falta el apartado" }, { status: 400 });
    }
    if (which !== "deposit" && which !== "balance") {
      return NextResponse.json({ error: "Parámetro inválido" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.rpc("mark_reservation_payment", {
      p_reservation_id: reservationId,
      p_which: which,
      p_actor_user_id: userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: reservation } = await supabase
      .from("reservations")
      .select("user_id, item_name")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservation) {
      await createNotification(supabase, {
        user_id: reservation.user_id,
        type: "reservation_status",
        title: which === "deposit" ? "Anticipo recibido" : "Saldo recibido",
        body: reservation.item_name,
        link: "/perfil/apartados",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en /api/reservations/payment:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
