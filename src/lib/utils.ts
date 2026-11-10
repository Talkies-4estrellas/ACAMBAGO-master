import { customAlphabet } from "nanoid";
import type { QRPayload } from "@/types";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function generateCouponCode(): string {
  return `ACAM-${nanoid()}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

export function formatDiscount(type: "percent" | "fixed", value: number): string {
  if (type === "percent") return `${value}% OFF`;
  return `$${value} MXN OFF`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Distancia en línea recta entre dos coordenadas (fórmula de Haversine).
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// QR personal de un cupon: el mismo qr_data pero con el user_id del comprador
// incrustado, para que redeem_coupon pueda impedir que la misma persona lo
// canjee dos veces. Sin user_id (o con un qr_data mal formado) se devuelve
// tal cual, en vez de tronar.
export function personalizeCouponQr(qrData: string, userId?: string | null): string {
  if (!userId) return qrData;
  try {
    const payload = JSON.parse(qrData) as QRPayload;
    return JSON.stringify({ ...payload, user_id: userId });
  } catch {
    return qrData;
  }
}

// expires_at siempre viene de un <input type="date"> (solo dia, sin
// hora) - new Date(iso) lo interpreta como medianoche UTC, y formatearlo
// con la hora local puede caer en el dia anterior (ej. Mexico, UTC-6).
// Esto arma la fecha a partir de sus partes year/month/day, en la zona
// local, para que el dia mostrado sea siempre el dia que se guardo.
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isCouponValid(coupon: {
  is_active: boolean;
  expires_at?: string | null;
  limit_count?: number | null;
  used_count: number;
}): { valid: boolean; reason?: string } {
  if (!coupon.is_active) return { valid: false, reason: "Cupón inactivo" };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: "Cupón expirado" };
  }
  if (coupon.limit_count !== null && coupon.limit_count !== undefined && coupon.used_count >= coupon.limit_count) {
    return { valid: false, reason: "Límite de usos alcanzado" };
  }
  return { valid: true };
}
