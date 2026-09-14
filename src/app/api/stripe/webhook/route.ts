import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

// Stripe llama esta URL server-to-server. La autenticidad se verifica con la
// firma del webhook (STRIPE_WEBHOOK_SECRET), nunca se confía en el body tal
// cual llega sin validarla primero.
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Stripe no está configurado" }, { status: 503 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Falta firma" }, { status: 400 });
    }

    const rawBody = await request.text();
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Firma de webhook de Stripe inválida:", err);
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        const paymentStatus = event.type === "payment_intent.succeeded" ? "pagado" : "fallido";
        const supabase = await createClient();
        await supabase
          .from("orders")
          .update({ payment_status: paymentStatus, stripe_payment_intent_id: paymentIntent.id })
          .eq("id", orderId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error procesando webhook de Stripe:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
