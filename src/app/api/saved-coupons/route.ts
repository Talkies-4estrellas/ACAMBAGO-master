import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  COUPON_REASON_MESSAGES,
  CouponUnavailableReason,
  getCouponUnavailableReason,
  normalizeCouponCode,
  normalizeCouponOrigin,
} from "@/lib/coupon-status";
import { personalizeCouponQr } from "@/lib/utils";

function unavailable(reason: CouponUnavailableReason, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { saved: false, reason, error: COUPON_REASON_MESSAGES[reason], ...extra },
    { status: reason === "not_found" ? 404 : 422 }
  );
}

// Guarda un cupon en la cuenta de quien tiene la sesion abierta (usado por
// /cupon/[code], al que llegan los lectores de la revista ACOM-Di). El
// user_id sale SIEMPRE de Clerk, nunca del navegador, y el estado del cupon
// se vuelve a revisar aqui antes de guardar. Guardar dos veces no duplica.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ saved: false, reason: "unauthorized", error: "Inicia sesión para guardar el cupón" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = normalizeCouponCode(body.code);
    const origin = normalizeCouponOrigin(body.origen);
    if (!code) return unavailable("not_found");

    const supabase = await createClient();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, business_id, title, description, discount_type, value, code, qr_data, limit_count, used_count, expires_at, is_active, businesses(name, is_approved, is_active)")
      .eq("code", code)
      .maybeSingle();

    if (!coupon) return unavailable("not_found");

    const business = coupon.businesses as unknown as { name: string; is_approved: boolean; is_active: boolean } | null;

    const [{ data: redemption }, { data: existing }] = await Promise.all([
      supabase.from("coupon_redemptions").select("id").eq("coupon_id", coupon.id).eq("user_id", userId).limit(1).maybeSingle(),
      supabase.from("saved_coupons").select("id").eq("coupon_id", coupon.id).eq("user_id", userId).maybeSingle(),
    ]);

    const reason = getCouponUnavailableReason(coupon, business, !!redemption);
    if (reason) return unavailable(reason, { already_saved: !!existing });

    // saved_coupons.user_id apunta a profiles(id). Quien se registra desde
    // aqui puede volver directo a la pagina del cupon sin pasar por
    // /onboarding (p. ej. "Continuar con Google" desde Iniciar sesion), y
    // entonces todavia no tiene perfil: se crea igual que en /onboarding,
    // sin tocar uno que ya exista (ignoreDuplicates, no cambia el rol).
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!profile) {
      const user = await currentUser();
      await supabase.from("profiles").upsert(
        { id: userId, name: user?.fullName ?? user?.firstName ?? "Usuario", role: "client" },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }

    let alreadySaved = !!existing;
    if (!alreadySaved) {
      // Llave de servicio: saved_coupons no le da INSERT a la llave anonima
      // (ver supabase/saved-coupons.sql), para que nadie pueda guardar
      // cupones a nombre de otra persona sin pasar por esta ruta.
      const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { error } = await service.from("saved_coupons").insert({ coupon_id: coupon.id, user_id: userId, origin });
      if (error) {
        // Otra pestaña lo guardo justo entre la consulta de arriba y este insert.
        if (error.code === "23505") {
          alreadySaved = true;
        } else {
          console.error("Error al guardar cupón:", error);
          return NextResponse.json({ saved: false, error: "No se pudo guardar el cupón. Intenta de nuevo." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      saved: true,
      already_saved: alreadySaved,
      qr_value: personalizeCouponQr(coupon.qr_data, userId),
    });
  } catch (err) {
    console.error("Error en /api/saved-coupons:", err);
    return NextResponse.json({ saved: false, error: "Error del servidor" }, { status: 500 });
  }
}
