import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/messages";
import { createNotification } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Crea un apartado. Dos origenes posibles:
//  - "catalog": el propio comprador aparta un producto que ya tiene
//    deposit_amount configurado. El precio/anticipo los vuelve a leer
//    create_reservation del lado del servidor, nunca se confia en lo que
//    mande este endpoint (mismo principio que create_order_with_items).
//  - "custom": el VENDEDOR crea el apartado desde el chat para algo que no
//    esta en el catalogo. Aqui si define precio/anticipo libremente, pero
//    solo despues de que esta ruta confirma que quien llama es el dueño
//    del negocio, y el RPC lo vuelve a confirmar el mismo dentro de la
//    transaccion.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const origin = body.origin;
    const businessId = body.business_id;
    const quantity = Number(body.quantity) || 1;
    const deliveryMethod = body.delivery_method;
    const branchId = typeof body.branch_id === "string" && UUID_RE.test(body.branch_id) ? body.branch_id : null;
    const address = deliveryMethod === "home" ? body.address ?? null : null;
    const paymentMethod = body.payment_method;

    if (!businessId || !UUID_RE.test(businessId)) {
      return NextResponse.json({ error: "Negocio inválido" }, { status: 400 });
    }
    if (deliveryMethod !== "pickup_branch" && deliveryMethod !== "home") {
      return NextResponse.json({ error: "Método de entrega inválido" }, { status: 400 });
    }
    if (deliveryMethod === "home" && !address) {
      return NextResponse.json({ error: "Falta la dirección de entrega" }, { status: 400 });
    }
    if (paymentMethod !== "transfer" && paymentMethod !== "in_person") {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const supabase = await createClient();

    if (origin === "catalog") {
      const productId = body.product_id;
      if (!productId || !UUID_RE.test(productId)) {
        return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
      }
      const customerName = typeof body.customer_name === "string" && body.customer_name.trim() ? body.customer_name.trim() : "Cliente";
      const customerPhone = typeof body.customer_phone === "string" && body.customer_phone.trim() ? body.customer_phone.trim() : null;

      const { data: reservationId, error } = await supabase.rpc("create_reservation", {
        p_origin: "catalog",
        p_business_id: businessId,
        p_actor_user_id: userId,
        p_user_id: userId,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_conversation_id: null,
        p_product_id: productId,
        p_item_name: null,
        p_item_description: null,
        p_unit_price: null,
        p_deposit_amount: null,
        p_quantity: quantity,
        p_delivery_method: deliveryMethod,
        p_branch_id: branchId,
        p_address: address,
        p_payment_method: paymentMethod,
      });

      if (error || !reservationId) {
        return NextResponse.json({ error: error?.message ?? "No se pudo crear el apartado" }, { status: 400 });
      }

      const { data: business } = await supabase.from("businesses").select("owner_id").eq("id", businessId).maybeSingle();
      if (business?.owner_id) {
        await createNotification(supabase, {
          user_id: business.owner_id,
          type: "new_reservation",
          title: `Nuevo apartado de ${customerName}`,
          body: "Aparto un producto de tu catálogo, revísalo en tu panel.",
          link: "/dashboard/business/apartados",
        });
      }

      return NextResponse.json({ id: reservationId });
    }

    if (origin === "custom") {
      const conversationId = body.conversation_id;
      if (!conversationId || !UUID_RE.test(conversationId)) {
        return NextResponse.json({ error: "Falta la conversación" }, { status: 400 });
      }
      const itemName = typeof body.item_name === "string" ? body.item_name.trim() : "";
      const itemDescription = typeof body.item_description === "string" && body.item_description.trim() ? body.item_description.trim() : null;
      const unitPrice = Number(body.unit_price);
      const depositAmount = Number(body.deposit_amount);

      if (!itemName) {
        return NextResponse.json({ error: "Falta el nombre del artículo" }, { status: 400 });
      }
      if (!unitPrice || unitPrice <= 0) {
        return NextResponse.json({ error: "El precio debe ser mayor a cero" }, { status: 400 });
      }
      if (!depositAmount || depositAmount <= 0 || depositAmount > unitPrice * quantity) {
        return NextResponse.json({ error: "El anticipo no es válido" }, { status: 400 });
      }

      const { data: business } = await supabase.from("businesses").select("owner_id").eq("id", businessId).maybeSingle();
      if (!business || business.owner_id !== userId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const { data: conversation } = await supabase
        .from("conversations")
        .select("id, business_id, user_id, customer_name")
        .eq("id", conversationId)
        .maybeSingle();
      if (!conversation || conversation.business_id !== businessId) {
        return NextResponse.json({ error: "Conversación inválida" }, { status: 400 });
      }

      const { data: reservationId, error } = await supabase.rpc("create_reservation", {
        p_origin: "custom",
        p_business_id: businessId,
        p_actor_user_id: userId,
        p_user_id: conversation.user_id,
        p_customer_name: conversation.customer_name,
        p_customer_phone: typeof body.customer_phone === "string" && body.customer_phone.trim() ? body.customer_phone.trim() : null,
        p_conversation_id: conversationId,
        p_product_id: null,
        p_item_name: itemName,
        p_item_description: itemDescription,
        p_unit_price: unitPrice,
        p_deposit_amount: depositAmount,
        p_quantity: quantity,
        p_delivery_method: deliveryMethod,
        p_branch_id: branchId,
        p_address: address,
        p_payment_method: paymentMethod,
      });

      if (error || !reservationId) {
        return NextResponse.json({ error: error?.message ?? "No se pudo crear el apartado" }, { status: 400 });
      }

      // El mensaje en el chat ya trae su propia notificacion (new_message,
      // ver sendMessage en src/lib/messages.ts) — no hace falta una segunda
      // notificacion aparte para este caso, a diferencia de "catalog" donde
      // no existe ningun chat de por medio.
      await sendMessage(supabase, {
        conversation_id: conversationId,
        sender_role: "business",
        sender_id: userId,
        body: `📦 Apartado creado: ${itemName} — Total ${formatPrice(unitPrice * quantity)}, anticipo ${formatPrice(depositAmount)}.`,
        recipient_user_id: conversation.user_id,
        notification_title: "Nuevo apartado",
        notification_link: "/perfil/apartados",
      });

      return NextResponse.json({ id: reservationId });
    }

    return NextResponse.json({ error: "Origen inválido" }, { status: 400 });
  } catch (err) {
    console.error("Error en /api/reservations/create:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
