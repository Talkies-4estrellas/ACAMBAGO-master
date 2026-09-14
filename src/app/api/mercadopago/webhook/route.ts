import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Mercado Pago llama esta URL server-to-server cuando cambia el estado de un
// pago (aprobado, rechazado, pendiente). No hay sesión de usuario aquí: la
// autenticidad se basa en volver a consultar el pago directo con el Access
// Token, nunca se confía en los datos del body tal cual llegan.
export async function POST(request: Request) {
  try {
    const businessId = new URL(request.url).searchParams.get("business_id");
    if (!businessId) {
      return NextResponse.json({ error: "Falta business_id" }, { status: 400 });
    }

    const body = await request.json();
    const paymentId = body?.data?.id;
    if (!paymentId || body?.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("mp_access_token")
      .eq("id", businessId)
      .single();

    const accessToken = business?.mp_access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Esta tienda no tiene Mercado Pago configurado" }, { status: 503 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(client).get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const paymentStatus =
      payment.status === "approved" ? "pagado" :
      payment.status === "rejected" ? "fallido" :
      "pendiente";

    await supabase
      .from("orders")
      .update({ payment_status: paymentStatus, mp_payment_id: String(payment.id) })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
