import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

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

    // El cobro se hace con la cuenta de Mercado Pago del negocio dueño del
    // pedido, no con una cuenta general de la plataforma, para que el dinero
    // le llegue directo a esa tienda.
    const { data: business } = await supabase
      .from("businesses")
      .select("mp_access_token")
      .eq("id", order.business_id)
      .single();

    const accessToken = business?.mp_access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Esta tienda no tiene Mercado Pago configurado" }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const items = (order.order_items ?? []).map((item: { name: string; price: number; quantity: number }) => ({
      title: item.name,
      unit_price: Number(item.price),
      quantity: item.quantity,
      currency_id: "MXN",
    }));

    if (order.shipping_cost > 0) {
      items.push({ title: "Envío a domicilio", unit_price: Number(order.shipping_cost), quantity: 1, currency_id: "MXN" });
    }

    const result = await preference.create({
      body: {
        items,
        external_reference: order.id,
        back_urls: {
          success: `${appUrl}/checkout/tracking?order=${order.id}`,
          pending: `${appUrl}/checkout/tracking?order=${order.id}`,
          failure: `${appUrl}/checkout/tracking?order=${order.id}`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/mercadopago/webhook?business_id=${order.business_id}`,
      },
    });

    await supabase.from("orders").update({ mp_preference_id: result.id }).eq("id", order.id);

    return NextResponse.json({ init_point: result.init_point });
  } catch (err) {
    console.error("Error creando preferencia de Mercado Pago:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
