import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, LogIn, Store, Ticket, UserPlus } from "lucide-react";
import CouponCard from "@/components/coupons/CouponCard";
import { Coupon } from "@/types";
import {
  COUPON_REASON_MESSAGES,
  CouponUnavailableReason,
  getCouponUnavailableReason,
  normalizeCouponCode,
  normalizeCouponOrigin,
} from "@/lib/coupon-status";
import SaveCouponPanel from "./SaveCouponPanel";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_DEMO = !SUPABASE_URL || SUPABASE_URL.includes("your-project") || SUPABASE_URL === "https://placeholder.supabase.co";

type CouponWithBusiness = Coupon & { businesses: { id: string; name: string; is_approved: boolean; is_active: boolean } | null };

async function getCoupon(code: string): Promise<CouponWithBusiness | null> {
  if (IS_DEMO) return null;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("id, business_id, title, description, discount_type, value, code, qr_data, limit_count, used_count, expires_at, is_active, created_at, businesses(id, name, is_approved, is_active)")
    .eq("code", code)
    .maybeSingle();
  return (data as unknown as CouponWithBusiness) ?? null;
}

async function hasRedeemed(couponId: string, userId: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("coupon_redemptions").select("id").eq("coupon_id", couponId).eq("user_id", userId).limit(1);
  return (data?.length ?? 0) > 0;
}

function Notice({ message }: { message: string }) {
  return (
    <div className="card p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>
        <Link href="/coupons" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
          Ver otros cupones disponibles
        </Link>
      </div>
    </div>
  );
}

// Página pública a la que llegan los lectores de la revista ACOM-Di
// ("Guárdalo en AcambaGo"): /cupon/ACAM-XXXXXX?origen=revista. Sin sesión
// muestra el cupón y los botones para entrar; con sesión lo guarda en la
// cuenta y muestra el QR personal.
export default async function CuponPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ origen?: string }>;
}) {
  const [{ code: rawCode }, { origen: rawOrigen }] = await Promise.all([params, searchParams]);
  const code = normalizeCouponCode(rawCode);
  const origen = normalizeCouponOrigin(rawOrigen);
  const coupon = code ? await getCoupon(code) : null;
  const { userId } = await auth();

  let reason: CouponUnavailableReason | null = coupon ? null : "not_found";
  if (coupon) {
    const redeemed = userId ? await hasRedeemed(coupon.id, userId) : false;
    reason = getCouponUnavailableReason(coupon, coupon.businesses, redeemed);
  }

  // Al volver de Iniciar sesión / Crear cuenta se regresa a esta misma
  // página (con su ?origen=), y ahí el cupón se guarda solo. Crear cuenta
  // pasa antes por /onboarding (crea el perfil) y de ahí vuelve aquí.
  const back = `/cupon/${code}${origen === "revista" ? "?origen=revista" : ""}`;
  const loginHref = `/login?redirect_url=${encodeURIComponent(back)}`;
  const signupHref = `/signup?redirect_url=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(back)}`)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Ticket className="w-6 h-6 text-brand-500" /> {origen === "revista" ? "Tu cupón de la revista" : "Cupón"}
        </h1>
        {coupon?.businesses && (
          <Link href={`/business/${coupon.businesses.id}`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 mt-1">
            <Store className="w-3.5 h-3.5" /> {coupon.businesses.name}
          </Link>
        )}
      </div>

      {coupon && <CouponCard coupon={coupon} />}

      {reason ? (
        <Notice message={COUPON_REASON_MESSAGES[reason]} />
      ) : userId ? (
        <SaveCouponPanel code={coupon!.code} origen={origen} />
      ) : (
        <div className="card p-6 space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Guárdalo en tu cuenta de AcambaGo para tener tu QR personal y usarlo en la tienda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={loginHref} className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
              <LogIn className="w-4 h-4" /> Iniciar sesión
            </Link>
            <Link href={signupHref} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
