import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { QRPayload, RedeemCouponResult } from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mensajes que se le muestran al vendedor por cada resultado posible del
// RPC `redeem_coupon` (ver supabase/coupon-scan-audit.sql). El RPC ya trae
// un `message` listo para mostrar, pero este mapa fija el texto exacto que
// pide el flujo de escaneo, sin depender de que nadie cambie el texto en SQL.
const OUTCOME_MESSAGES: Record<string, string> = {
  duplicate: "Este cupón ya fue canjeado.",
  invalid_code: "Cupón inválido.",
  inactive: "Este cupón está desactivado.",
  expired: "Este cupón ya venció.",
  limit_reached: "Este cupón ya alcanzó su límite de usos.",
  wrong_business: "Este cupón pertenece a otra tienda.",
};

// Escanea (confirm=false) o canja (confirm=true) un cupón por QR. Ambos
// pasos llaman al mismo RPC atómico para que la validación de "sigue siendo
// válido" y el canje real ocurran en una sola transacción de Postgres — así
// dos escaneos del mismo cupón al mismo tiempo no pueden ambos pasar el
// límite de usos (ver el row lock `FOR UPDATE` dentro del RPC).
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    let payload: QRPayload;
    try {
      payload = typeof body.qr_data === "string" ? JSON.parse(body.qr_data) : body.qr_data;
    } catch {
      return NextResponse.json({ error: "Cupón inválido", outcome: "invalid_code" }, { status: 400 });
    }

    const { coupon_code, business_id } = payload ?? {};
    const customerUserId: string | null = body.user_id || null;
    const confirm: boolean = body.confirm === true;
    // Monto de la venta (opcional): si el vendedor lo captura, el RPC calcula
    // el descuento y el total a cobrar del lado del servidor, no del cliente.
    const saleAmount: number | null =
      typeof body.sale_amount === "number" && body.sale_amount > 0 ? body.sale_amount : null;

    if (!coupon_code || typeof coupon_code !== "string" || !business_id || !UUID_RE.test(business_id)) {
      return NextResponse.json({ error: "Cupón inválido", outcome: "invalid_code" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("redeem_coupon", {
      p_coupon_code: coupon_code,
      p_qr_business_id: business_id,
      p_scanning_owner_id: userId,
      p_customer_user_id: customerUserId,
      p_confirm: confirm,
      p_sale_amount: saleAmount,
    });

    if (error) {
      console.error("Error en redeem_coupon:", error);
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }

    const result = (Array.isArray(data) ? data[0] : data) as RedeemCouponResult | undefined;
    if (!result) {
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }

    if (result.outcome !== "redeemed") {
      return NextResponse.json(
        { success: false, outcome: result.outcome, error: OUTCOME_MESSAGES[result.outcome] ?? result.message },
        { status: result.outcome === "wrong_business" ? 403 : 400 }
      );
    }

    // Nombre del cliente para mostrarlo en la pantalla de confirmación
    // (best-effort: si no hay user_id en el QR, o no se encuentra el
    // perfil, simplemente no se muestra nombre).
    let customerName: string | null = null;
    if (customerUserId) {
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", customerUserId).maybeSingle();
      customerName = profile?.name ?? null;
    }

    return NextResponse.json({
      success: true,
      phase: confirm ? "confirm" : "scan",
      message: confirm ? "Cupón canjeado exitosamente" : "Cupón válido",
      coupon: {
        title: result.coupon_title,
        discount_type: result.discount_type,
        value: result.discount_value,
        code: result.out_coupon_code,
      },
      business_name: result.business_name,
      customer_name: customerName,
      redemption_id: result.redemption_id,
      sale_amount: result.sale_amount,
      discount_amount: result.discount_amount,
      final_amount: result.final_amount,
    });
  } catch (err) {
    console.error("Error en /api/coupons/validate:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
