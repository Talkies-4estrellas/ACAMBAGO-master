// Reglas para saber si un cupon se puede guardar/usar. Mismas reglas y mismo
// orden que redeem_coupon (supabase/coupon-scan-audit.sql), mas la del
// negocio (aprobado y activo), que el canje no revisa pero que aqui si
// importa: un cupon de una tienda suspendida no debe guardarse.

export type CouponUnavailableReason =
  | "not_found"
  | "business_inactive"
  | "inactive"
  | "expired"
  | "limit_reached"
  | "already_used";

export const COUPON_REASON_MESSAGES: Record<CouponUnavailableReason, string> = {
  not_found: "No encontramos este cupón. Revisa que el código esté bien escrito.",
  business_inactive: "Esta tienda ya no está disponible en AcambaGo, así que este cupón no se puede guardar.",
  inactive: "Este cupón está desactivado.",
  expired: "Este cupón ya venció.",
  limit_reached: "Este cupón ya alcanzó su límite de usos.",
  already_used: "Ya canjeaste este cupón.",
};

interface CouponLike {
  is_active: boolean;
  expires_at?: string | null;
  limit_count?: number | null;
  used_count: number;
}

interface BusinessLike {
  is_approved: boolean;
  is_active: boolean;
}

export function getCouponUnavailableReason(
  coupon: CouponLike,
  business: BusinessLike | null | undefined,
  alreadyRedeemed = false
): CouponUnavailableReason | null {
  if (!business || !business.is_approved || !business.is_active) return "business_inactive";
  if (!coupon.is_active) return "inactive";
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return "expired";
  if (coupon.limit_count != null && coupon.used_count >= coupon.limit_count) return "limit_reached";
  if (alreadyRedeemed) return "already_used";
  return null;
}

// Solo "revista" es un origen especial; cualquier otro valor (incluido
// ninguno) cuenta como "app". Lista blanca: el valor llega de la URL.
export type CouponOrigin = "revista" | "app";

export function normalizeCouponOrigin(raw: unknown): CouponOrigin {
  return raw === "revista" ? "revista" : "app";
}

// Los codigos se generan en mayuscula (ACAM-XXXXXX), pero el enlace puede
// llegar en minuscula; se normaliza antes de buscar. Devuelve null si ni
// siquiera tiene forma de codigo (evita consultar la base con basura).
export function normalizeCouponCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{3,32}$/.test(code) ? code : null;
}
