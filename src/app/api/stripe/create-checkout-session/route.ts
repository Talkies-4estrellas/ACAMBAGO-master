import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // El cargo se hace como destination charge hacia la cuenta conectada del
    // negocio dueño del pedido, para que el dinero le llegue directo a esa
    // tienda y no se concentre en la cuenta de la plataforma.
    const { data: business } = await supabase
      .from("businesses")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", order.business_id)
      .single();

    if (!business?.stripe_account_id || !business.stripe_charges_enabled) {
      return NextResponse.json({ error: "Esta tienda no tiene Stripe configurado" }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    const line_items = (order.order_items ?? []).map((item: { name: string; price: number; quantity: number }) => ({
      price_data: {
        currency: "mxn",
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    if (order.shipping_cost > 0) {
      line_items.push({
        price_data: {
          currency: "mxn",
          product_data: { name: "Envío a domicilio" },
          unit_amount: Math.round(Number(order.shipping_cost) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      payment_intent_data: {
        transfer_data: { destination: business.stripe_account_id },
        metadata: { order_id: order.id },
      },
      success_url: `${appUrl}/checkout/tracking?order=${order.id}`,
      cancel_url: `${appUrl}/checkout/tracking?order=${order.id}`,
      metadata: { order_id: order.id },
    });

    await supabase.from("orders").update({ stripe_payment_intent_id: session.payment_intent as string }).eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de Stripe Checkout:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
